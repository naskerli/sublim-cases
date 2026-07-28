import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, createSession, verifyPassword } from "@/lib/auth";
import { normalizeCode } from "@/lib/qrcodes";

export const runtime = "nodejs";

const schema = z.object({
  staffCode: z.string().min(1),
  password: z.string().min(1),
});

// Sadə sürət məhdudiyyəti.
// Stend kodu mağazanı özü müəyyən etdiyi üçün girişdə yalnız şifrə istənilir —
// bu, email+şifrədən zəifdir, ona görə uğursuz cəhdləri məhdudlaşdırırıq.
// Qeyd: yaddaşdadır, yəni bir instansiya üçün işləyir. Çoxlu instansiyada
// paylaşılan saymağa (Redis/DB) keçirilməlidir.
const MAX_ATTEMPTS = 6;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, { count: number; first: number }>();

function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) return false;
  return rec.count >= MAX_ATTEMPTS;
}

function noteFailure(key: string) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now });
  } else {
    rec.count++;
  }
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Şifrə tələb olunur." }, { status: 400 });
  }

  const staffCode = normalizeCode(parsed.data.staffCode);

  if (tooManyAttempts(staffCode)) {
    return NextResponse.json(
      { error: "Çox sayda cəhd. 10 dəqiqə sonra yenidən yoxlayın." },
      { status: 429 },
    );
  }

  const qr = await prisma.qrCode.findUnique({
    where: { staffCode },
    include: {
      store: {
        include: {
          users: { where: { active: true } },
        },
      },
    },
  });

  const invalid = NextResponse.json(
    { error: "Şifrə yanlışdır." },
    { status: 401 },
  );

  if (!qr || !qr.active || !qr.store || !qr.store.active) {
    noteFailure(staffCode);
    return invalid;
  }

  // Stend mağazanı müəyyən edir; şifrə həmin mağazanın aktiv
  // istifadəçilərindən biri ilə uyğun gəlməlidir.
  let matched: { id: string } | null = null;
  for (const u of qr.store.users) {
    if (await verifyPassword(parsed.data.password, u.passwordHash)) {
      matched = { id: u.id };
      break;
    }
  }

  if (!matched) {
    noteFailure(staffCode);
    return invalid;
  }

  attempts.delete(staffCode);

  const token = await createSession(matched.id);
  const res = NextResponse.json({ ok: true, redirectTo: "/store" });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
