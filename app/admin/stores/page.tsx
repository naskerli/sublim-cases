import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage() {
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      orders: { select: { total: true, commissionAmount: true } },
      users: { select: { id: true, email: true } },
    },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Mağazalar</h1>
        <Link
          href="/admin/stores/new"
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white active:bg-indigo-700"
        >
          + Yeni mağaza
        </Link>
      </div>

      {stores.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-gray-400">
          Hələ mağaza qeydiyyatdan keçməyib.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {stores.map((s) => {
          const revenue = s.orders.reduce((sum, o) => sum + o.total, 0);
          const commission = s.orders.reduce(
            (sum, o) => sum + o.commissionAmount,
            0,
          );
          return (
            <Link
              key={s.id}
              href={`/admin/stores/${s.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-indigo-300 active:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900">{s.name}</h2>
                  <p className="text-xs text-gray-500">
                    {s.city ?? ""} {s.address ? `· ${s.address}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                    s.active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s.active ? "Aktiv" : "Deaktiv"}
                </span>
              </div>

              <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600">
                /s/{s.slug}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Stat label="Sifariş" value={String(s.orders.length)} />
                <Stat label="Dövriyyə" value={formatPrice(revenue)} />
                <Stat
                  label={`Komissiya (${(s.commissionRate * 100).toFixed(0)}%)`}
                  value={formatPrice(commission)}
                />
              </div>

              <p className="mt-3 text-xs text-gray-500">
                {s.users.length > 0
                  ? `Admin: ${s.users.map((u) => u.email).join(", ")}`
                  : "⚠ Admin təyin olunmayıb"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 py-2">
      <p className="text-sm font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}
