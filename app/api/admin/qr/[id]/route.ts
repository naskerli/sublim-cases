import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role, getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  // null → təyinatı geri al
  storeId: z.string().nullable().optional(),
  active: z.boolean().optional(),
  note: z.string().max(200).nullable().optional(),
});

// QR kodu mağazaya təyin edir / təyinatı geri alır / deaktiv edir.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== Role.PLATFORM_ADMIN) {
    return NextResponse.json({ error: "İcazə yoxdur." }, { status: 403 });
  }

  const { id } = await params;
  const qr = await prisma.qrCode.findUnique({ where: { id } });
  if (!qr) {
    return NextResponse.json({ error: "Kod tapılmadı." }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış məlumat." }, { status: 400 });
  }
  const d = parsed.data;

  const data: {
    storeId?: string | null;
    assignedAt?: Date | null;
    active?: boolean;
    note?: string | null;
  } = {};

  if (d.storeId !== undefined) {
    if (d.storeId) {
      const store = await prisma.store.findUnique({
        where: { id: d.storeId },
      });
      if (!store) {
        return NextResponse.json(
          { error: "Mağaza tapılmadı." },
          { status: 404 },
        );
      }
      data.storeId = store.id;
      data.assignedAt = new Date();
    } else {
      data.storeId = null;
      data.assignedAt = null;
    }
  }
  if (d.active !== undefined) data.active = d.active;
  if (d.note !== undefined) data.note = d.note;

  await prisma.qrCode.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

// Tək kodu silir. Sifarişi olan kod silinmir — tarixçə qorunur.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== Role.PLATFORM_ADMIN) {
    return NextResponse.json({ error: "İcazə yoxdur." }, { status: 403 });
  }

  const { id } = await params;
  const qr = await prisma.qrCode.findUnique({
    where: { id },
    select: { id: true, _count: { select: { orders: true } } },
  });
  if (!qr) {
    return NextResponse.json({ error: "Kod tapılmadı." }, { status: 404 });
  }
  if (qr._count.orders > 0) {
    return NextResponse.json(
      {
        error:
          "Bu koddan sifariş gəlib — silinə bilməz. Əvəzinə deaktiv edin.",
      },
      { status: 409 },
    );
  }

  await prisma.qrCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
