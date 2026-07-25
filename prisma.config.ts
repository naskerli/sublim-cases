import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma CLI (migrate/introspect) konfiqurasiyası.
//
// Supabase iki bağlantı verir:
//   DATABASE_URL — pooler (pgbouncer, port 6543). Runtime sorğuları üçün.
//   DIRECT_URL   — birbaşa bağlantı (port 5432). Miqrasiyalar üçün.
//
// Miqrasiyalar DDL və advisory lock istifadə edir, ona görə pooler-dən yox,
// birbaşa bağlantıdan getməlidir. DIRECT_URL yoxdursa DATABASE_URL-ə düşür.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
