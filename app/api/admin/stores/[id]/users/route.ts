import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role, getSessionUser, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional().or(z.literal("")),
  password: z.string().min(6, "Şifrə minimum 6 simvol olmalıdır."),
});

// Mağazaya admin təyin et.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getSessionUser();
  if (!actor || actor.role !== Role.PLATFORM_ADMIN) {
    return NextResponse.json({ error: "İcazə yoxdur." }, { status: 403 });
  }

  const { id } = await params;
  const store = await prisma.store.findUnique({ where: { id } });
  if (!store) {
    return NextResponse.json({ error: "Mağaza tapılmadı." }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Məlumatlar natamamdır." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken) {
    return NextResponse.json(
      { error: "Bu email artıq qeydiyyatdadır." },
      { status: 409 },
    );
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(parsed.data.password),
      name: parsed.data.name || null,
      role: Role.STORE_ADMIN,
      storeId: store.id,
    },
  });

  return NextResponse.json({ ok: true });
}
