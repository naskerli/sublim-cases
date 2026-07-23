import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      orders: { select: { total: true, commissionAmount: true } },
    },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">Mağazalar</h1>
      <p className="mb-6 text-sm text-gray-500">
        Hər mağazanın QR linki <code>/s/&lt;slug&gt;</code> formatındadır.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {stores.map((s) => {
          const revenue = s.orders.reduce((sum, o) => sum + o.total, 0);
          const commission = s.orders.reduce(
            (sum, o) => sum + o.commissionAmount,
            0,
          );
          return (
            <div
              key={s.id}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{s.name}</h2>
                  <p className="text-xs text-gray-500">
                    {s.city ?? ""} {s.address ? `· ${s.address}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
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

              {s.contactName && (
                <p className="mt-3 text-xs text-gray-500">
                  Əlaqə: {s.contactName}{" "}
                  {s.contactPhone ? `· ${s.contactPhone}` : ""}
                </p>
              )}
            </div>
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
