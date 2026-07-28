import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { getBaseUrl, qrDataUrl, standUrl } from "@/lib/qr";
import QrCard from "@/components/panel/QrCard";

export const dynamic = "force-dynamic";

export default async function StoreQrPage() {
  const user = await requireStoreAdmin();

  const [store, stands, baseUrl] = await Promise.all([
    prisma.store.findUnique({ where: { id: user.storeId } }),
    prisma.qrCode.findMany({
      where: { storeId: user.storeId, active: true },
      orderBy: { assignedAt: "asc" },
      include: { _count: { select: { orders: true } } },
    }),
    getBaseUrl(),
  ]);
  if (!store) notFound();

  const withQr = await Promise.all(
    stands.map(async (s) => ({
      code: s.code,
      orders: s._count.orders,
      url: standUrl(baseUrl, s.code),
      qr: await qrDataUrl(standUrl(baseUrl, s.code)),
    })),
  );

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-xl font-bold text-gray-900">Stendlərim</h1>
      <p className="mb-5 text-sm text-gray-500">
        Müştəri stenddəki kodu skan edəndə sifariş sizin mağazanıza yazılır.
      </p>

      {withQr.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center">
          <p className="text-gray-500">
            Mağazanıza hələ stend təyin olunmayıb.
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Stend quraşdırıldıqdan sonra kodu burada görəcəksiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {withQr.map((s) => (
            <div
              key={s.code}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.qr}
                  alt={`${s.code} QR kodu`}
                  className="h-36 w-36 shrink-0 rounded-lg border border-gray-200 bg-white p-1.5"
                  width={144}
                  height={144}
                />
                <div className="w-full min-w-0 text-center sm:text-left">
                  <p className="font-mono text-lg font-bold tracking-[0.2em] text-gray-900">
                    {s.code}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Bu stenddən {s.orders} sifariş gəlib
                  </p>
                  <p className="mt-2 break-all font-mono text-xs text-gray-400">
                    {s.url}
                  </p>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 active:bg-gray-50"
                  >
                    Sifariş səhifəsini aç
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stend yoxdursa mağazanın birbaşa linki köməkçi kimi qalır */}
      {withQr.length === 0 && (
        <div className="mt-4">
          <QrCard
            baseUrl={baseUrl}
            slug={store.slug}
            hint="Stend gələnə qədər bu linkdən istifadə edə bilərsiniz."
          />
        </div>
      )}
    </div>
  );
}
