import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role, getSessionUser } from "@/lib/auth";
import { OrderStatus, PaymentStatus } from "@/lib/constants";

export const runtime = "nodejs";

const schema = z.object({
  status: z.enum(Object.values(OrderStatus) as [string, ...string[]]).optional(),
  paymentStatus: z
    .enum(Object.values(PaymentStatus) as [string, ...string[]])
    .optional(),
});

// Sifariş statusunu yenilə.
// Platforma admini bütün sifarişləri, mağaza admini yalnız öz mağazasının
// sifarişlərini dəyişə bilər.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "İcazə yoxdur." }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Sifariş tapılmadı." }, { status: 404 });
  }

  if (user.role !== Role.PLATFORM_ADMIN && user.storeId !== order.storeId) {
    return NextResponse.json({ error: "İcazə yoxdur." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış status." }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ ok: true, status: updated.status });
}
