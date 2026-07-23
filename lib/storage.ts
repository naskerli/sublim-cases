import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

// data:URL şəklini diskə yazır və public yolunu (/uploads/...) qaytarır.
// Qeyd: MVP üçün lokal disk. İstehsalda S3/obyekt-store-a keçiriləcək.
export async function saveDataUrl(
  dataUrl: string | null | undefined,
  prefix: string,
): Promise<string | null> {
  if (!dataUrl || !dataUrl.startsWith("data:")) return null;

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  const mime = match[1];
  const ext = mime.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
  const buffer = Buffer.from(match[2], "base64");

  // Sadə ölçü limiti (10 MB)
  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error("Şəkil çox böyükdür (maksimum 10 MB).");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${prefix}-${randomUUID()}.${ext}`;
  await writeFile(join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
}
