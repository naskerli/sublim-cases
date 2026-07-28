import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { PAYOUT_THRESHOLD, getStoreBalances } from "@/lib/payouts";
import StatCards from "@/components/panel/StatCards";
import RecordPayout from "./RecordPayout";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const [balances, recent] = await Promise.all([
    getStoreBalances(),
    prisma.payout.findMany({
      orderBy: { paidAt: "desc" },
      take: 30,
      include: {
        store: { select: { name: true } },
        _count: { select: { orders: true } },
      },
    }),
  ]);

  const totalPending = balances.reduce((s, b) => s + b.pending, 0);
  const readyCount = balances.filter((b) => b.ready).length;
  const totalPaid = balances.reduce((s, b) => s + b.paidTotal, 0);

  // Ödənişə hazır olanlar üstdə
  const sorted = [...balances].sort(
    (a, b) => Number(b.ready) - Number(a.ready) || b.pending - a.pending,
  );

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Mağaza ödənişləri</h1>
      <p className="mb-4 mt-1 text-sm text-gray-500">
        Komissiya borcu {formatPrice(PAYOUT_THRESHOLD)} həddinə çatanda
        mağazaya ödəniş edilir. Ödəniş qeyd olunanda həmin sifarişlər bağlanır
        və borc sıfırlanır.
      </p>

      <StatCards
        stats={[
          { label: "Ümumi borc", value: formatPrice(totalPending) },
          { label: "Ödənişə hazır", value: String(readyCount) },
          { label: "Ödənilmiş cəm", value: formatPrice(totalPaid) },
        ]}
      />

      {/* Mağaza balansları */}
      <div className="space-y-3">
        {sorted.map((b) => (
          <div
            key={b.storeId}
            className={`rounded-xl border p-4 ${
              b.ready
                ? "border-emerald-300 bg-emerald-50/50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-gray-900">{b.storeName}</h2>
                  {b.ready && (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Ödənişə hazır
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {b.orderCount} ödənilməmiş sifariş · komissiya{" "}
                  {(b.commissionRate * 100).toFixed(0)}%
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  İndiyədək ödənilib: {formatPrice(b.paidTotal)}
                </p>
              </div>

              <div className="text-right">
                <p
                  className={`text-2xl font-bold ${
                    b.ready ? "text-emerald-700" : "text-gray-900"
                  }`}
                >
                  {formatPrice(b.pending)}
                </p>
                {!b.ready && b.pending > 0 && (
                  <p className="text-[11px] text-gray-400">
                    həddə {formatPrice(PAYOUT_THRESHOLD - b.pending)} qalıb
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3">
              <RecordPayout
                storeId={b.storeId}
                storeName={b.storeName}
                pending={b.pending}
                orderCount={b.orderCount}
                ready={b.ready}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Ödəniş tarixçəsi */}
      <h2 className="mb-3 mt-8 text-sm font-semibold text-gray-900">
        Son ödənişlər
      </h2>
      {recent.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400">
          Hələ ödəniş qeydə alınmayıb.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">Tarix</th>
                <th className="whitespace-nowrap px-4 py-3">Mağaza</th>
                <th className="whitespace-nowrap px-4 py-3">Məbləğ</th>
                <th className="whitespace-nowrap px-4 py-3">Üsul</th>
                <th className="whitespace-nowrap px-4 py-3">Sifariş</th>
                <th className="whitespace-nowrap px-4 py-3">Qeyd</th>
                <th className="whitespace-nowrap px-4 py-3">Qeyd edən</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {p.paidAt.toLocaleDateString("az-AZ")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                    {p.store.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">
                    {formatPrice(p.amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {p.method === "CASH" ? "Nağd" : "Köçürmə"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {p._count.orders}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.note ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                    {p.recordedByEmail ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
