import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const stores = await prisma.store
    .findMany({ where: { active: true }, orderBy: { createdAt: "asc" } })
    .catch(() => []);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-500">
        Sublim Cases
      </p>
      <h1 className="mt-2 text-4xl font-bold text-gray-900">
        Özəl dizayn telefon kabroları
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        Mağaza vitrinindəki QR kodu oxut, şəklini yüklə, telefon modelini seç və
        kabronun üzərində necə görünəcəyini dərhal gör. Mətn əlavə et,
        aksesuarları seç və sifariş ver.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Admin panel
        </Link>
      </div>

      {stores.length > 0 && (
        <div className="mt-12">
          <p className="mb-3 text-sm font-medium text-gray-500">
            Nümunə mağaza vitrinləri (demo):
          </p>
          <div className="flex flex-wrap gap-2">
            {stores.map((s) => (
              <Link
                key={s.id}
                href={`/s/${s.slug}`}
                className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
