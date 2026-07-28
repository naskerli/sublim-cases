import { randomInt } from "crypto";
import { prisma } from "./prisma";

// Səhv oxunan simvollar çıxarılıb: 0/O, 1/I/L, U/V.
// Dəstək zamanı müştəri kodu telefonla oxuyacaq — qarışmamalıdır.
const ALPHABET = "23456789ACDEFGHJKMNPQRSTWXYZ";
const CODE_LENGTH = 6;

export function generateCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

// İstifadəçinin yazdığı kodu normallaşdırır: boşluq/tire atılır, böyük hərfə.
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Unikal kodlarla partiya yaradır. Nadir toqquşmalarda yenidən cəhd edir.
export async function createBatch(
  count: number,
  batch: string | null,
): Promise<string[]> {
  const created: string[] = [];

  for (let i = 0; i < count; i++) {
    let saved = false;
    for (let attempt = 0; attempt < 8 && !saved; attempt++) {
      const code = generateCode();
      try {
        await prisma.qrCode.create({ data: { code, batch } });
        created.push(code);
        saved = true;
      } catch {
        // unique constraint — başqa kod sınayırıq
      }
    }
    if (!saved) {
      throw new Error(
        "Unikal kod yaradıla bilmədi. Yenidən cəhd edin.",
      );
    }
  }

  return created;
}
