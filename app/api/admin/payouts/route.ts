import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role, getSessionUser } from "@/lib/auth";
import { payableWhere } from "@/lib/payouts";

export const runtime = "nodejs";

const schema = z.object({
  storeId: z.string().min(1),
  method: z.enum(["CASH", "BANK"]).default("CASH"),
  note: z.string().max(300).optional().or(z.literal("")),
});

// Mağazaya ödənişi qeydə alır.
// Cari ödənilməmiş komissiyanın HAMISI bir ödənişlə bağlanır — məbləği
// admin əl ilə yazmır, sistem sifarişlərdən hesablayır ki, hesabat
// həmişə sifarişlərlə uzlaşsın.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== Role.PLATFORM_ADMIN) {
    return NextResponse.json({ error: "İcazə yoxdur." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış məlumat." }, { status: 400 });
  }
  const { storeId, method, note } = parsed.data;

  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    return NextResponse.json({ error: "Mağaza tapılmadı." }, { status: 404 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Bağlanacaq sifarişləri transaksiya daxilində oxuyuruq ki,
      // eyni anda ikinci ödəniş qeydi eyni sifarişləri tutmasın.
      const orders = await tx.order.findMany({
        where: { ...payableWhere, storeId },
        select: { id: true, commissionAmount: true },
      });

      if (orders.length === 0) {
        return { empty: true as const };
      }

      const amount =
        Math.round(
          orders.reduce((sum, o) => sum + o.commissionAmount, 0) * 100,
        ) / 100;

      const payout = await tx.payout.create({
        data: {
          storeId,
          amount,
          method,
          note: note || null,
          recordedBy: user.id,
          recordedByEmail: user.email,
        },
      });

      await tx.order.updateMany({
        where: { id: { in: orders.map((o) => o.id) } },
        data: { payoutId: payout.id },
      });

      return {
        empty: false as const,
        payoutId: payout.id,
        amount,
        orderCount: orders.length,
      };
    });

    if (result.empty) {
      return NextResponse.json(
        { error: "Ödəniləcək komissiya yoxdur." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json(
      { error: "Ödəniş qeydə alınmadı." },
      { status: 500 },
    );
  }
}
