import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role, getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  batch: z.string().min(1),
});

// Partiyanı silir.
// Sifarişi olan kodlar SİLİNMİR — onlar tarixçənin bir hissəsidir və
// silinsə mövcud sifarişlərin hansı stenddən gəldiyi itərdi.
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== Role.PLATFORM_ADMIN) {
    return NextResponse.json({ error: "İcazə yoxdur." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Partiya adı lazımdır." }, { status: 400 });
  }

  const codes = await prisma.qrCode.findMany({
    where: { batch: parsed.data.batch },
    select: { id: true, _count: { select: { orders: true } } },
  });

  if (codes.length === 0) {
    return NextResponse.json({ error: "Partiya tapılmadı." }, { status: 404 });
  }

  const deletable = codes.filter((c) => c._count.orders === 0).map((c) => c.id);
  const kept = codes.length - deletable.length;

  if (deletable.length > 0) {
    await prisma.qrCode.deleteMany({ where: { id: { in: deletable } } });
  }

  return NextResponse.json({
    ok: true,
    deleted: deletable.length,
    kept,
  });
}
