import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role, getSessionUser, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug yalnız kiçik hərf, rəqəm və tire ola bilər."),
  city: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  contactName: z.string().optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
  commissionRate: z.number().min(0).max(1),
  // Mağaza admini (istəyə bağlı — sonra da təyin oluna bilər)
  adminEmail: z.string().email().optional().or(z.literal("")),
  adminName: z.string().optional().or(z.literal("")),
  adminPassword: z.string().min(6).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== Role.PLATFORM_ADMIN) {
    return NextResponse.json({ error: "İcazə yoxdur." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Məlumatlar natamamdır." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const existing = await prisma.store.findUnique({ where: { slug: d.slug } });
  if (existing) {
    return NextResponse.json(
      { error: "Bu slug artıq istifadə olunur." },
      { status: 409 },
    );
  }

  // Admin təyin olunursa, email-in boş olduğunu əvvəlcədən yoxla.
  const wantsAdmin = !!d.adminEmail && !!d.adminPassword;
  if (d.adminEmail && !d.adminPassword) {
    return NextResponse.json(
      { error: "Admin üçün şifrə tələb olunur (minimum 6 simvol)." },
      { status: 400 },
    );
  }
  if (wantsAdmin) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: d.adminEmail!.toLowerCase() },
    });
    if (emailTaken) {
      return NextResponse.json(
        { error: "Bu email artıq qeydiyyatdadır." },
        { status: 409 },
      );
    }
  }

  const store = await prisma.store.create({
    data: {
      name: d.name,
      slug: d.slug,
      city: d.city || null,
      address: d.address || null,
      contactName: d.contactName || null,
      contactPhone: d.contactPhone || null,
      contactEmail: d.adminEmail ? d.adminEmail.toLowerCase() : null,
      commissionRate: d.commissionRate,
    },
  });

  if (wantsAdmin) {
    await prisma.user.create({
      data: {
        email: d.adminEmail!.toLowerCase(),
        passwordHash: await hashPassword(d.adminPassword!),
        name: d.adminName || null,
        role: Role.STORE_ADMIN,
        storeId: store.id,
      },
    });
  }

  return NextResponse.json({ ok: true, storeId: store.id });
}
