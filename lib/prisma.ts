import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Next.js dev-də hot reload zamanı çoxlu client (və pool) yaranmasının
// qarşısını alır.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL təyin olunmayıb. Supabase bağlantı sətrini env dəyişənlərinə əlavə edin.",
    );
  }

  // Runtime sorğuları pooler (DATABASE_URL) üzərindən gedir.
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

// Lazy proxy: client yalnız ilk sorğuda yaradılır.
// `next build` route konfiqurasiyasını toplamaq üçün bu modulu import edir —
// o mərhələdə DATABASE_URL olmaya bilər və build bazaya heç toxunmamalıdır.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
