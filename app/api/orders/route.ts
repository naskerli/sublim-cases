import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { saveDataUrl } from "@/lib/storage";
import { generateOrderNumber } from "@/lib/format";
import { normalizeCode } from "@/lib/qrcodes";
import { createCardCheckout } from "@/lib/payment";
import { SHIPPING_FEE } from "@/lib/types";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductType,
} from "@/lib/constants";

export const runtime = "nodejs";

const schema = z.object({
  storeSlug: z.string().min(1),
  // Fiziki stendin kodu. Verilibsə mağaza BUNDAN təyin olunur —
  // stend hansı mağazaya bağlıdırsa sifariş ora yazılır.
  qrCode: z.string().nullable().optional(),
  phoneModelId: z.string().min(1),
  uploadedImage: z.string().nullable().optional(),
  designImage: z.string().nullable().optional(),
  customText: z.string().nullable().optional(),
  textOptions: z.unknown().optional(),
  addons: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .default([]),
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(7),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
  }),
  pickupPointId: z.string().min(1),
  paymentMethod: z.enum([PaymentMethod.CARD, PaymentMethod.CASH_ON_DELIVERY]),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Yanlış sorğu." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Məlumatlar natamamdır.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // --- Serverdə doğrulama və qiymətlər (client-ə etibar edilmir) ---
  // QR kod verilibsə mağaza ondan təyin olunur — client-in göndərdiyi
  // storeSlug-a etibar edilmir, əks halda sifariş başqa mağazaya yazıla bilər.
  let qrCodeId: string | null = null;
  let store: Awaited<ReturnType<typeof prisma.store.findUnique>> = null;

  if (data.qrCode) {
    const qr = await prisma.qrCode.findUnique({
      where: { code: normalizeCode(data.qrCode) },
      include: { store: true },
    });
    if (!qr || !qr.active || !qr.store) {
      return NextResponse.json(
        { error: "Bu stend hələ aktiv deyil." },
        { status: 404 },
      );
    }
    qrCodeId = qr.id;
    store = qr.store;
  } else {
    store = await prisma.store.findUnique({
      where: { slug: data.storeSlug },
    });
  }

  if (!store || !store.active) {
    return NextResponse.json({ error: "Mağaza tapılmadı." }, { status: 404 });
  }

  const phoneModel = await prisma.phoneModel.findUnique({
    where: { id: data.phoneModelId },
  });
  if (!phoneModel || !phoneModel.active) {
    return NextResponse.json(
      { error: "Telefon modeli tapılmadı." },
      { status: 404 },
    );
  }

  const caseProduct = await prisma.product.findFirst({
    where: { type: ProductType.CASE, active: true },
  });
  if (!caseProduct) {
    return NextResponse.json(
      { error: "Kabro məhsulu konfiqurasiya olunmayıb." },
      { status: 500 },
    );
  }

  const pickupPoint = await prisma.pickupPoint.findUnique({
    where: { id: data.pickupPointId },
  });
  if (!pickupPoint || !pickupPoint.active) {
    return NextResponse.json(
      { error: "Pickup məntəqəsi tapılmadı." },
      { status: 404 },
    );
  }

  // Addon qiymətləri bazadan (snapshot)
  const addonIds = data.addons.map((a) => a.productId);
  const addonProducts = addonIds.length
    ? await prisma.product.findMany({
        where: { id: { in: addonIds }, type: ProductType.ADDON, active: true },
      })
    : [];
  const addonMap = new Map(addonProducts.map((p) => [p.id, p]));

  let addonsTotal = 0;
  const addonRows = data.addons
    .map((a) => {
      const p = addonMap.get(a.productId);
      if (!p) return null;
      addonsTotal += p.price * a.quantity;
      return { productId: p.id, quantity: a.quantity, unitPrice: p.price };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const casePrice = caseProduct.price;
  const total = casePrice + addonsTotal + SHIPPING_FEE;
  const commissionRate = store.commissionRate;
  const commissionAmount = Math.round(total * commissionRate * 100) / 100;

  // --- Şəkilləri saxla ---
  let uploadedPath: string | null = null;
  let designPath: string | null = null;
  try {
    uploadedPath = await saveDataUrl(data.uploadedImage, "upload");
    designPath = await saveDataUrl(data.designImage, "design");
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Şəkil saxlanmadı." },
      { status: 400 },
    );
  }

  const orderNumber = generateOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      storeId: store.id,
      qrCodeId,
      phoneModelId: phoneModel.id,
      uploadedImage: uploadedPath,
      designImage: designPath,
      customText: data.customText || null,
      textOptions: data.textOptions ? JSON.stringify(data.textOptions) : null,
      casePrice,
      addonsTotal,
      shippingFee: SHIPPING_FEE,
      total,
      commissionRate,
      commissionAmount,
      customerName: data.customer.name,
      customerPhone: data.customer.phone,
      customerEmail: data.customer.email || null,
      shippingAddress: data.customer.address || null,
      pickupPointId: pickupPoint.id,
      paymentMethod: data.paymentMethod,
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.PENDING,
      addons: { create: addonRows },
    },
  });

  // --- Kart ödənişi (Stripe konfiqurasiya olunubsa) ---
  if (data.paymentMethod === PaymentMethod.CARD) {
    const origin = new URL(req.url).origin;
    const checkout = await createCardCheckout({
      orderNumber,
      amount: total,
      customerEmail: data.customer.email || null,
      successUrl: `${origin}/s/${store.slug}?paid=${orderNumber}`,
      cancelUrl: `${origin}/s/${store.slug}?cancelled=${orderNumber}`,
    });
    if (checkout) {
      return NextResponse.json({
        orderNumber: order.orderNumber,
        checkoutUrl: checkout.url,
      });
    }
    // Stripe yoxdursa — sifariş "ödəniş gözləyir" olaraq qalır, biz əlaqə saxlayırıq.
  }

  return NextResponse.json({ orderNumber: order.orderNumber });
}
