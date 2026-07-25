import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// Müştəri şəkilləri Supabase Storage-da private bucket-də saxlanılır.
// Bazada yalnız obyekt açarı (məs. "design/uuid.jpg") saxlanılır; panel
// göstərəndə qısamüddətli imzalı URL yaradılır.
//
// Supabase konfiqurasiya olunmayıbsa (lokal dev) lokal diskə düşür.

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "order-images";
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_BYTES = 10 * 1024 * 1024;
const SIGNED_URL_TTL = 60 * 60; // 1 saat

let cachedClient: SupabaseClient | null | undefined;
let bucketReady = false;

function getSupabase(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;

  // Səhvən əlavə olunmuş boşluq/sonluq kəsilir — "https://x.supabase.co/"
  // kimi dəyər sorğu yolunu pozur.
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  // Yeni açar sistemi: "Secret key" (sb_secret_...).
  // Köhnə layihələrdə: service_role JWT. Hər ikisi dəstəklənir.
  const key = (
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim();

  if (!url || !key) {
    cachedClient = null;
    return cachedClient;
  }

  if (!/^https:\/\/[^/]+$/.test(url)) {
    console.error(
      `[storage] SUPABASE_URL düzgün deyil: "${url}". ` +
        'Gözlənilən format: "https://<ref>.supabase.co" ' +
        "(Project Settings → API → Project URL). Baza bağlantı sətri DEYİL.",
    );
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(url, key, { auth: { persistSession: false } });
  return cachedClient;
}

export function storageConfigured(): boolean {
  return getSupabase() !== null;
}

// Bucket yoxdursa yaratmağa çalışır (private).
// Uğursuz olsa da yükləməni bloklamır — bucket artıq mövcud ola bilər,
// yaxud açarın bucket yaratma icazəsi olmaya bilər. Həqiqi nəticəni
// yükləmənin özü göstərəcək.
async function ensureBucket(client: SupabaseClient): Promise<void> {
  if (bucketReady) return;
  bucketReady = true; // hər yükləmədə təkrarlanmasın

  const { error: createError } = await client.storage.createBucket(BUCKET, {
    public: false,
  });

  if (createError && !/already exists|resource already/i.test(createError.message)) {
    console.warn(
      `[storage] "${BUCKET}" bucket-i avtomatik yaradıla bilmədi: ` +
        `${createError.message}. Supabase → Storage bölməsindən əl ilə ` +
        "yaradın (private).",
    );
  }
}

function parseDataUrl(
  dataUrl: string,
): { buffer: Buffer; mime: string; ext: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  const mime = match[1];
  const ext = mime.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
  return { buffer: Buffer.from(match[2], "base64"), mime, ext };
}

// data:URL şəklini saxlayır.
// Supabase varsa obyekt açarı ("design/uuid.jpg"), yoxdursa lokal yol
// ("/uploads/design-uuid.jpg") qaytarır.
export async function saveDataUrl(
  dataUrl: string | null | undefined,
  prefix: string,
): Promise<string | null> {
  if (!dataUrl || !dataUrl.startsWith("data:")) return null;

  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return null;

  if (parsed.buffer.length > MAX_BYTES) {
    throw new Error("Şəkil çox böyükdür (maksimum 10 MB).");
  }

  const client = getSupabase();

  if (client) {
    const key = `${prefix}/${randomUUID()}.${parsed.ext}`;

    const upload = () =>
      client.storage.from(BUCKET).upload(key, parsed.buffer, {
        contentType: parsed.mime,
        upsert: false,
      });

    // Əvvəlcə birbaşa yükləməyə cəhd — bucket mövcuddursa əlavə sorğu getmir.
    let { error } = await upload();

    // Bucket yoxdursa yaradıb bir dəfə təkrarla.
    if (error && /bucket not found|not found/i.test(error.message)) {
      await ensureBucket(client);
      ({ error } = await upload());
    }

    if (error) {
      throw new Error(
        `Şəkil Supabase Storage-a yüklənmədi (bucket: "${BUCKET}"): ${error.message}`,
      );
    }
    return key;
  }

  // Lokal dev fallback.
  // DİQQƏT: yalnız `next dev` üçün. `next start` public/ qovluğunu build
  // zamanı sabitləyir, ona görə runtime-da yazılan fayllar serve olunmur —
  // istehsalda Supabase Storage mütləqdir.
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[storage] SUPABASE_URL/SUPABASE_SECRET_KEY təyin olunmayıb — " +
        "şəkil lokal diskə yazılır və istehsalda GÖRÜNMƏYƏCƏK. " +
        "Supabase Storage konfiqurasiya edin.",
    );
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${prefix}-${randomUUID()}.${parsed.ext}`;
  await writeFile(join(UPLOAD_DIR, name), parsed.buffer);
  return `/uploads/${name}`;
}

// Bazadakı dəyəri göstərilə bilən URL-ə çevirir.
// Köhnə lokal yollar ("/uploads/...") və tam URL-lər olduğu kimi qalır.
export async function getImageUrl(
  value: string | null | undefined,
): Promise<string | null> {
  if (!value) return null;
  if (value.startsWith("/") || value.startsWith("http")) return value;

  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(value, SIGNED_URL_TTL);

  if (error || !data) return null;
  return data.signedUrl;
}
