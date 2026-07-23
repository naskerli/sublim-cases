import { cookies } from "next/headers";
import { createHash } from "crypto";

// Sadə admin auth (MVP): ADMIN_PASSWORD env dəyəri ilə cookie token müqayisəsi.
// İstehsalda tam auth (NextAuth və s.) ilə əvəzlənməlidir.

export const ADMIN_COOKIE = "sc_admin";

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin123";
}

export function tokenFor(password: string): string {
  return createHash("sha256")
    .update(`sublim:${password}`)
    .digest("hex");
}

export function expectedToken(): string {
  return tokenFor(adminPassword());
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  return !!token && token === expectedToken();
}
