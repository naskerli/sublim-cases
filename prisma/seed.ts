import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { scrypt as _scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

// lib/auth.ts ilə eyni format: <salt>:<hash>
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

// Seed deploy zamanı işləyir — miqrasiyalarla eyni bağlantıdan getsin.
const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

// Kabro forması: canvas komponenti bu ölçülərə görə çəkir (asset faylı lazım deyil).
const caseShape = (camera: "single" | "triple" = "triple") =>
  JSON.stringify({ w: 320, h: 660, radius: 54, camera });

async function main() {
  // --- Mağazalar (QR vitrinləri) ---
  const stores = [
    {
      slug: "gencluk-mall",
      name: "MobiStyle — Gənclik Mall",
      city: "Bakı",
      address: "Gənclik Mall, 2-ci mərtəbə",
      contactName: "Rəşad",
      contactPhone: "+994 50 111 22 33",
      commissionRate: 0.15,
    },
    {
      slug: "28-mall",
      name: "PhoneUp — 28 Mall",
      city: "Bakı",
      address: "28 Mall, 1-ci mərtəbə",
      contactName: "Aygün",
      contactPhone: "+994 55 444 55 66",
      commissionRate: 0.12,
    },
    {
      slug: "ganja-central",
      name: "Aksesuar Mərkəzi — Gəncə",
      city: "Gəncə",
      address: "Nizami küç. 12",
      contactName: "Elvin",
      contactPhone: "+994 51 777 88 99",
      commissionRate: 0.18,
    },
  ];
  for (const s of stores) {
    await prisma.store.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
  }

  // --- Panel istifadəçiləri ---
  // Mövcud istifadəçilərin parolu yenidən yazılmır (deploy zamanı sıfırlanmasın).
  async function ensureUser(data: {
    email: string;
    password: string;
    name: string;
    role: string;
    storeId?: string | null;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) return existing;
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: await hashPassword(data.password),
        name: data.name,
        role: data.role,
        storeId: data.storeId ?? null,
      },
    });
  }

  // Platforma admini (biz)
  await ensureUser({
    email: process.env.PLATFORM_ADMIN_EMAIL ?? "admin@sublim.az",
    password: process.env.PLATFORM_ADMIN_PASSWORD ?? "admin123",
    name: "Platforma Admini",
    role: "PLATFORM_ADMIN",
  });

  // Hər demo mağaza üçün mağaza admini
  const storeAdmins = [
    { slug: "gencluk-mall", email: "mobistyle@sublim.az", name: "Rəşad (MobiStyle)" },
    { slug: "28-mall", email: "phoneup@sublim.az", name: "Aygün (PhoneUp)" },
    { slug: "ganja-central", email: "ganja@sublim.az", name: "Elvin (Gəncə)" },
  ];
  for (const a of storeAdmins) {
    const store = await prisma.store.findUnique({ where: { slug: a.slug } });
    if (!store) continue;
    await ensureUser({
      email: a.email,
      password: "magaza123",
      name: a.name,
      role: "STORE_ADMIN",
      storeId: store.id,
    });
  }

  // --- Telefon modelləri ---
  const phones = [
    { brand: "Apple", name: "iPhone 15 Pro Max", slug: "iphone-15-pro-max", camera: "triple" },
    { brand: "Apple", name: "iPhone 15", slug: "iphone-15", camera: "single" },
    { brand: "Apple", name: "iPhone 14 Pro", slug: "iphone-14-pro", camera: "triple" },
    { brand: "Apple", name: "iPhone 13", slug: "iphone-13", camera: "single" },
    { brand: "Samsung", name: "Galaxy S24 Ultra", slug: "galaxy-s24-ultra", camera: "triple" },
    { brand: "Samsung", name: "Galaxy S23", slug: "galaxy-s23", camera: "triple" },
    { brand: "Samsung", name: "Galaxy A54", slug: "galaxy-a54", camera: "single" },
    { brand: "Xiaomi", name: "Redmi Note 13 Pro", slug: "redmi-note-13-pro", camera: "triple" },
  ];
  let order = 0;
  for (const p of phones) {
    await prisma.phoneModel.upsert({
      where: { slug: p.slug },
      update: {
        brand: p.brand,
        name: p.name,
        printArea: caseShape(p.camera as "single" | "triple"),
        sortOrder: order,
      },
      create: {
        brand: p.brand,
        name: p.name,
        slug: p.slug,
        printArea: caseShape(p.camera as "single" | "triple"),
        sortOrder: order,
      },
    });
    order++;
  }

  // --- Məhsullar: əsas kabro + cross-sell ---
  const products = [
    {
      slug: "custom-case",
      name: "Özəl dizayn kabro",
      type: "CASE",
      description: "Sənin şəklin və mətninlə fərdi telefon kabrosu",
      price: 24.9,
      sortOrder: 0,
    },
    {
      slug: "keychain",
      name: "Uyğun brelok (keychain)",
      type: "ADDON",
      description: "Kabronla eyni dizaynda mini brelok",
      price: 6.9,
      sortOrder: 1,
    },
    {
      slug: "screen-protector",
      name: "Ekran qoruyucu şüşə",
      type: "ADDON",
      description: "9H bərkliyində tam örtük qoruyucu",
      price: 5.0,
      sortOrder: 2,
    },
    {
      slug: "phone-strap",
      name: "Telefon ipi (strap)",
      type: "ADDON",
      description: "Boyun və ya bilək ipi, rəngli",
      price: 4.5,
      sortOrder: 3,
    },
    {
      slug: "magsafe-ring",
      name: "MagSafe üzük tutacaq",
      type: "ADDON",
      description: "Maqnitli barmaq tutacağı və stend",
      price: 7.9,
      sortOrder: 4,
    },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }

  // --- Kargo pickup məntəqələri (ilkin seed) ---
  const points = [
    { code: "BK-NARIMANOV", name: "Nərimanov filialı", city: "Bakı", address: "Atatürk pr. 21", lat: 40.4093, lng: 49.8671 },
    { code: "BK-NIZAMI", name: "Nizami filialı", city: "Bakı", address: "Nizami küç. 203", lat: 40.3777, lng: 49.8516 },
    { code: "BK-YASAMAL", name: "Yasamal filialı", city: "Bakı", address: "Şərifzadə küç. 5", lat: 40.3897, lng: 49.8065 },
    { code: "BK-XATAI", name: "Xətai filialı", city: "Bakı", address: "Babək pr. 100", lat: 40.3833, lng: 49.9333 },
    { code: "GN-MERKEZ", name: "Gəncə mərkəz filialı", city: "Gəncə", address: "Cavadxan küç. 8", lat: 40.6828, lng: 46.3606 },
    { code: "SM-MERKEZ", name: "Sumqayıt filialı", city: "Sumqayıt", address: "Sülh küç. 14", lat: 40.5897, lng: 49.6686 },
  ];
  for (const pt of points) {
    await prisma.pickupPoint.upsert({
      where: { code: pt.code },
      update: pt,
      create: pt,
    });
  }

  console.log("Seed tamamlandı:");
  console.log(`  ${stores.length} mağaza, ${phones.length} telefon modeli, ${products.length} məhsul, ${points.length} pickup məntəqəsi`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
