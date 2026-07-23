import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAuthed } from "@/lib/auth";
import { OrderStatus, PaymentStatus } from "@/lib/constants";

export const runtime = "nodejs";

const schema = z.object({
  status: z.enum(Object.values(OrderStatus) as [string, ...string[]]).optional(),
  paymentStatus: z
    .enum(Object.values(PaymentStatus) as [string, ...string[]])
    .optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "İcazə yoxdur." }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış status." }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ ok: true, status: updated.status });
}
