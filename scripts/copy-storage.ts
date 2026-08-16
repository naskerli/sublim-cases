/**
 * Supabase Storage bucket-ini bir proyektdən digərinə köçürür.
 *
 * Bazadakı `Order.uploadedImage` / `Order.designImage` yalnız obyekt
 * AÇARINI saxlayır ("design/uuid.jpg"), faylın özünü yox. Ona görə baza
 * köçürüləndə şəkillər də köçürülməlidir — yoxsa panel boş şəkil göstərər.
 *
 * İstifadə:
 *   SOURCE_SUPABASE_URL="https://köhnə.supabase.co" \
 *   SOURCE_SUPABASE_SECRET_KEY="sb_secret_..." \
 *   TARGET_SUPABASE_URL="https://yeni.supabase.co" \
 *   TARGET_SUPABASE_SECRET_KEY="sb_secret_..." \
 *   npx tsx scripts/copy-storage.ts
 *
 * Skript idempotentdir: hədəfdə mövcud olan fayl yenidən yüklənmir.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "order-images";
const PAGE = 100;

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`✗ ${name} təyin olunmayıb.`);
    process.exit(1);
  }
  return v;
}

function client(url: string, key: string): SupabaseClient {
  return createClient(url.replace(/\/+$/, ""), key, {
    auth: { persistSession: false },
  });
}

// Bucket-dəki bütün obyekt açarlarını yığır.
// Supabase `list()` qovluq əsaslıdır — kök səviyyədə prefikslər, sonra
// hər prefiksin içi səhifə-səhifə gəzilir.
async function listAllKeys(sb: SupabaseClient): Promise<string[]> {
  const keys: string[] = [];

  async function walk(prefix: string) {
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await sb.storage
        .from(BUCKET)
        .list(prefix, { limit: PAGE, offset, sortBy: { column: "name", order: "asc" } });

      if (error) throw new Error(`list("${prefix}") uğursuz: ${error.message}`);
      if (!data || data.length === 0) return;

      for (const entry of data) {
        const path = prefix ? `${prefix}/${entry.name}` : entry.name;
        // id === null → qovluq (prefiks), içinə girmək lazımdır.
        if (entry.id === null) await walk(path);
        else keys.push(path);
      }

      if (data.length < PAGE) return;
    }
  }

  await walk("");
  return keys;
}

async function main() {
  const source = client(
    requireEnv("SOURCE_SUPABASE_URL"),
    requireEnv("SOURCE_SUPABASE_SECRET_KEY"),
  );
  const target = client(
    requireEnv("TARGET_SUPABASE_URL"),
    requireEnv("TARGET_SUPABASE_SECRET_KEY"),
  );

  // Hədəfdə bucket yoxdursa yaradılır (private — imzalı URL ilə oxunur).
  const { error: bucketError } = await target.storage.createBucket(BUCKET, {
    public: false,
  });
  if (bucketError && !/already exists/i.test(bucketError.message)) {
    console.warn(`! bucket yaradıla bilmədi: ${bucketError.message}`);
  }

  console.log(`"${BUCKET}" oxunur…`);
  const keys = await listAllKeys(source);
  console.log(`${keys.length} fayl tapıldı.\n`);

  let copied = 0;
  let skipped = 0;
  const failed: string[] = [];

  for (const key of keys) {
    const { data: blob, error: dlError } = await source.storage
      .from(BUCKET)
      .download(key);

    if (dlError || !blob) {
      failed.push(`${key} (endirilmədi: ${dlError?.message})`);
      continue;
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    const { error: upError } = await target.storage
      .from(BUCKET)
      .upload(key, buffer, {
        contentType: blob.type || "application/octet-stream",
        upsert: false, // mövcud faylı əzmə
      });

    if (upError) {
      if (/already exists|duplicate/i.test(upError.message)) {
        skipped++;
      } else {
        failed.push(`${key} (yüklənmədi: ${upError.message})`);
        continue;
      }
    } else {
      copied++;
    }

    const done = copied + skipped + failed.length;
    if (done % 25 === 0) console.log(`  … ${done}/${keys.length}`);
  }

  console.log(
    `\n✓ ${copied} fayl köçürüldü` + (skipped ? `, ${skipped} artıq var idi.` : "."),
  );

  if (failed.length) {
    console.error(`\n✗ ${failed.length} fayl köçürülmədi:`);
    for (const f of failed.slice(0, 20)) console.error(`  ${f}`);
    if (failed.length > 20) console.error(`  … və ${failed.length - 20} digəri`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("\n✗ Köçürmə dayandı:", e instanceof Error ? e.message : e);
  process.exit(1);
});
