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

// Unikal kodlarla partiya yaradır. Hər stend üçün iki kod:
//   code      — ön tərəf, müştəri üçün
//   staffCode — arxa tərəf, satıcı üçün
// Nadir toqquşmalarda yenidən cəhd edir.
export async function createBatch(
  count: number,
  batch: string | null,
): Promise<string[]> {
  const created: string[] = [];

  for (let i = 0; i < count; i++) {
    let saved = false;
    for (let attempt = 0; attempt < 8 && !saved; attempt++) {
      const code = generateCode();
      const staffCode = generateCode();
      if (code === staffCode) continue;
      try {
        await prisma.qrCode.create({ data: { code, staffCode, batch } });
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

// staffCode-u olmayan köhnə sətirləri doldurur (idempotent).
export async function backfillStaffCodes(): Promise<number> {
  const missing = await prisma.qrCode.findMany({
    where: { staffCode: null },
    select: { id: true },
  });

  let filled = 0;
  for (const row of missing) {
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        await prisma.qrCode.update({
          where: { id: row.id },
          data: { staffCode: generateCode() },
        });
        filled++;
        break;
      } catch {
        // toqquşma — yenidən
      }
    }
  }
  return filled;
}
