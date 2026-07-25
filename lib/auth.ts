import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  randomBytes,
  scrypt as _scrypt,
  timingSafeEqual,
} from "crypto";
import { promisify } from "util";
import { prisma } from "./prisma";

const scrypt = promisify(_scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = "sc_session";
const SESSION_DAYS = 7;

export const Role = {
  PLATFORM_ADMIN: "PLATFORM_ADMIN",
  STORE_ADMIN: "STORE_ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

// --- Parol ---

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = await scrypt(password, salt, 64);
  const keyBuf = Buffer.from(key, "hex");
  if (keyBuf.length !== derived.length) return false;
  return timingSafeEqual(keyBuf, derived);
}

// --- Sessiya ---

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  return token;
}

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  storeId: string | null;
  storeName: string | null;
  storeSlug: string | null;
};

// Cari istifadəçini cookie-dəki sessiya tokenindən oxuyur.
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { store: true } } },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (!session.user.active) return null;

  const u = session.user;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    storeId: u.storeId,
    storeName: u.store?.name ?? null,
    storeSlug: u.store?.slug ?? null,
  };
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
}

// --- Mühafizələr (server komponentləri üçün) ---

// Girişi olmayan istifadəçini /login-ə yönləndirir.
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

// Yalnız platforma admini.
export async function requirePlatformAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== Role.PLATFORM_ADMIN) redirect("/store");
  return user;
}

// Yalnız mağaza admini (mağazası təyin olunmuş).
export async function requireStoreAdmin(): Promise<
  SessionUser & { storeId: string }
> {
  const user = await requireUser();
  if (user.role === Role.PLATFORM_ADMIN) redirect("/admin");
  if (!user.storeId) redirect("/login");
  return user as SessionUser & { storeId: string };
}

// Giriş sonrası rola uyğun başlanğıc səhifə.
export function homePathFor(role: string): string {
  return role === Role.PLATFORM_ADMIN ? "/admin" : "/store";
}
