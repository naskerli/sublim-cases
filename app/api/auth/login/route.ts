import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  createSession,
  destroySession,
  homePathFor,
  verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Email və şifrə tələb olunur." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Eyni mesaj — mövcud email-i sızdırmamaq üçün.
  const invalid = NextResponse.json(
    { error: "Email və ya şifrə yanlışdır." },
    { status: 401 },
  );

  if (!user || !user.active) return invalid;
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return invalid;
  }

  const token = await createSession(user.id);
  const res = NextResponse.json({
    ok: true,
    redirectTo: homePathFor(user.role),
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

export async function DELETE() {
  await destroySession();
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
