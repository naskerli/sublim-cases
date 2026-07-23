import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { getBaseUrl, qrDataUrl, storeUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const [stores, baseUrl] = await Promise.all([
    prisma.store.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        orders: { select: { total: true, commissionAmount: true } },
      },
    }),
    getBaseUrl(),
  ]);

  const withQr = await Promise.all(
    stores.map(async (s) => ({
      store: s,
      url: storeUrl(baseUrl, s.slug),
      qr: await qrDataUrl(storeUrl(baseUrl, s.slug)),
    })),
  );

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">Mağazalar</h1>
      <p className="mb-6 text-sm text-gray-500">
        Hər mağaza üçün QR kodu çap edib vitrinə yerləşdir. Müştəri
        skan edəndə birbaşa həmin mağazanın sifariş səhifəsinə düşür.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {withQr.map(({ store: s, url, qr }) => {
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

              <div className="mt-4 flex flex-col items-center gap-3 rounded-lg bg-gray-50 p-4 sm:flex-row sm:items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qr}
                  alt={`${s.name} QR kodu`}
                  className="h-36 w-36 shrink-0 rounded-lg border border-gray-200 bg-white p-1.5"
                  width={144}
                  height={144}
                />
                <div className="w-full min-w-0 text-center sm:text-left">
                  <p className="break-all font-mono text-xs text-gray-600">
                    {url}
                  </p>
                  <a
                    href={`/api/admin/stores/${s.slug}/qr`}
                    download={`qr-${s.slug}.png`}
                    className="mt-2 inline-block rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white active:bg-indigo-700"
                  >
                    QR-ı yüklə (çap üçün)
                  </a>
                </div>
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
