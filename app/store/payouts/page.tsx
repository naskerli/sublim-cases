import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { PAYOUT_THRESHOLD, getPendingForStore } from "@/lib/payouts";

export const dynamic = "force-dynamic";

// Mağaza öz komissiya balansını burada görür — nə qədər yığılıb,
// hədd üçün nə qədər qalıb və indiyədək hansı ödənişlər edilib.
export default async function StorePayoutsPage() {
  const user = await requireStoreAdmin();
  const storeId = user.storeId!;

  const [balance, payouts] = await Promise.all([
    getPendingForStore(storeId),
    prisma.payout.findMany({
      where: { storeId },
      orderBy: { paidAt: "desc" },
      take: 50,
      include: { _count: { select: { orders: true } } },
    }),
  ]);

  const paidTotal = payouts.reduce((s, p) => s + p.amount, 0);
  const ready = balance.pending >= PAYOUT_THRESHOLD;
  const progress = Math.min(100, (balance.pending / PAYOUT_THRESHOLD) * 100);
  const remaining = Math.max(0, PAYOUT_THRESHOLD - balance.pending);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Komissiyam</h1>
      <p className="mb-4 mt-1 text-sm text-gray-500">
        Komissiyanız {formatPrice(PAYOUT_THRESHOLD)} həddinə çatanda nağd
        ödənilir.
      </p>

      {/* Cari balans */}
      <div
        className={`rounded-2xl border p-5 ${
          ready
            ? "border-emerald-300 bg-emerald-50"
            : "border-gray-200 bg-white"
        }`}
      >
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Ödənilməmiş komissiya
        </p>
        <p
          className={`mt-1 text-3xl font-bold ${
            ready ? "text-emerald-700" : "text-gray-900"
          }`}
        >
          {formatPrice(balance.pending)}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {balance.orderCount} sifarişdən
        </p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full ${
              ready ? "bg-emerald-600" : "bg-gray-900"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {ready
            ? "Ödənişə hazırdır — tezliklə sizinlə əlaqə saxlanılacaq."
            : `Ödəniş həddinə ${formatPrice(remaining)} qalıb.`}
        </p>
      </div>

      {/* Ödəniş tarixçəsi */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">
          Alınmış ödənişlər
        </h2>
        <span className="text-sm font-semibold text-gray-900">
          {formatPrice(paidTotal)}
        </span>
      </div>

      {payouts.length === 0 ? (
        <div className="mt-3 rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400">
          Hələ ödəniş edilməyib.
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {payouts.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {formatPrice(p.amount)}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {p.paidAt.toLocaleDateString("az-AZ")} ·{" "}
                  {p.method === "CASH" ? "Nağd" : "Köçürmə"} ·{" "}
                  {p._count.orders} sifariş
                </p>
                {p.note && (
                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    {p.note}
                  </p>
                )}
              </div>
              <span className="ml-3 shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                Ödənilib
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
