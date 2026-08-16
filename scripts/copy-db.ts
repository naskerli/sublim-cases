/**
 * Verilənlər bazasını bir Supabase proyektindən digərinə köçürür.
 *
 * pg_dump tələb etmir — Prisma ilə oxuyub yazır, ona görə cədvəl sırası
 * (foreign key asılılıqları) burada dəqiq idarə olunur.
 *
 * İstifadə:
 *   SOURCE_DATABASE_URL="postgresql://...köhnə..." \
 *   TARGET_DATABASE_URL="postgresql://...yeni..." \
 *   npx tsx scripts/copy-db.ts
 *
 * Əvvəlcə YENİ proyektdə sxem qurulmuş olmalıdır:
 *   DATABASE_URL=<yeni> DIRECT_URL=<yeni-direct> npx prisma migrate deploy
 *
 * Skript idempotentdir: mövcud sətirlər (eyni id) atlanır, ona görə
 * yarımçıq qalsa təkrar işlətmək təhlükəsizdir.
 */
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Foreign key sırası: əvvəl asılı olmayanlar.
// Order → Payout, QrCode, Store, PhoneModel, PickupPoint asılılığı var,
// ona görə Order sondan əvvəl gəlir.
const TABLES = [
  "store",
  "phoneModel",
  "product",
  "pickupPoint",
  "qrCode",
  "user",
  "session",
  "payout",
  "order",
  "orderAddon",
] as const;

const BATCH = 200;

function client(url: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`✗ ${name} təyin olunmayıb.`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const sourceUrl = requireEnv("SOURCE_DATABASE_URL");
  const targetUrl = requireEnv("TARGET_DATABASE_URL");

  if (sourceUrl === targetUrl) {
    console.error("✗ Mənbə və hədəf eyni bazadır.");
    process.exit(1);
  }

  const source = client(sourceUrl);
  const target = client(targetUrl);

  console.log("Köçürmə başlayır…\n");
  let totalCopied = 0;
  let totalSkipped = 0;

  try {
    for (const table of TABLES) {
      // Prisma delegate-ləri dinamik seçilir — hər cədvəl üçün eyni məntiq.
      const from = source[table] as unknown as {
        findMany: (a: unknown) => Promise<Record<string, unknown>[]>;
      };
      const to = target[table] as unknown as {
        createMany: (a: unknown) => Promise<{ count: number }>;
      };

      const rows = await from.findMany({ orderBy: { id: "asc" } });
      if (rows.length === 0) {
        console.log(`  ${table.padEnd(12)} — boş`);
        continue;
      }

      let copied = 0;
      for (let i = 0; i < rows.length; i += BATCH) {
        const chunk = rows.slice(i, i + BATCH);
        // skipDuplicates: təkrar işlədildikdə mövcud sətirlər atlanır.
        const res = await to.createMany({ data: chunk, skipDuplicates: true });
        copied += res.count;
      }

      const skipped = rows.length - copied;
      totalCopied += copied;
      totalSkipped += skipped;
      console.log(
        `  ${table.padEnd(12)} — ${copied}/${rows.length} köçürüldü` +
          (skipped ? ` (${skipped} artıq var idi)` : ""),
      );
    }

    console.log(
      `\n✓ Bitdi. ${totalCopied} sətir köçürüldü` +
        (totalSkipped ? `, ${totalSkipped} atlandı.` : "."),
    );
  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }
}

main().catch((e) => {
  console.error("\n✗ Köçürmə dayandı:", e instanceof Error ? e.message : e);
  console.error("Skript idempotentdir — problemi həll edib təkrar işlədin.");
  process.exit(1);
});
