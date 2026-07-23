import QRCode from "qrcode";
import { headers } from "next/headers";

// Server komponentlərində cari hostu (protokol + domen) müəyyən edir.
// Railway/Vercel kimi platformalarda proxy başlıqlarına etibar edir.
export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export function storeUrl(baseUrl: string, slug: string): string {
  return `${baseUrl}/s/${slug}`;
}

// Ekranda göstərmək üçün data URL (PNG, base64).
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 320,
    margin: 2,
    color: { dark: "#111827", light: "#ffffff" },
  });
}

// Çap üçün yüksək rezolyusiyalı PNG buffer.
export async function qrPngBuffer(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    width: 1024,
    margin: 3,
    color: { dark: "#111827", light: "#ffffff" },
  });
}
