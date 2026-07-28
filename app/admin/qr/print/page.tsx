import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBaseUrl, qrDataUrl, standUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

// Toplu çap vərəqi — brauzerdən birbaşa çap edilir (Ctrl/Cmd+P).
// Hər QR-ın altında kodu yazılır ki, stend hazırlanarkən qarışmasın.
export default async function QrPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; status?: string }>;
}) {
  const sp = await searchParams;

  const where = {
    ...(sp.batch ? { batch: sp.batch } : {}),
    ...(sp.status === "free"
      ? { storeId: null }
      : sp.status === "assigned"
        ? { NOT: { storeId: null } }
        : {}),
  };

  const [codes, baseUrl] = await Promise.all([
    prisma.qrCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    getBaseUrl(),
  ]);

  const items = await Promise.all(
    codes.map(async (c) => ({
      code: c.code,
      url: standUrl(baseUrl, c.code),
      qr: await qrDataUrl(standUrl(baseUrl, c.code)),
      staffCode: c.staffCode,
      staffQr: c.staffCode
        ? await qrDataUrl(`${baseUrl}/m/${c.staffCode}`)
        : null,
    })),
  );

  return (
    <div className="bg-white p-6 print:p-0">
      {/* Çapda görünmür */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link href="/admin/qr" className="text-sm text-indigo-600">
            ← QR stendlərə qayıt
          </Link>
          <h1 className="mt-2 text-lg font-bold text-gray-900">
            Çap vərəqi — {items.length} kod
            {sp.batch ? ` · ${sp.batch}` : ""}
          </h1>
          <p className="text-sm text-gray-500">
            Çap etmək üçün Ctrl/Cmd + P.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-center text-gray-400">Bu seçimdə kod yoxdur.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2 print:gap-3">
          {items.map((it) => (
            <div
              key={it.code}
              className="break-inside-avoid rounded-lg border border-gray-300 p-3"
            >
              <div className="grid grid-cols-2 gap-3">
                {/* ÖN — müştəri */}
                <div className="flex flex-col items-center rounded-md bg-gray-50 p-2">
                  <span className="mb-1 rounded bg-indigo-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Ön · Müştəri
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.qr}
                    alt={it.code}
                    className="h-auto w-full max-w-[130px]"
                  />
                  <p className="mt-1 font-mono text-sm font-bold tracking-[0.18em] text-gray-900">
                    {it.code}
                  </p>
                </div>

                {/* ARXA — satıcı */}
                <div className="flex flex-col items-center rounded-md bg-gray-50 p-2">
                  <span className="mb-1 rounded bg-gray-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Arxa · Satıcı
                  </span>
                  {it.staffQr ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it.staffQr}
                        alt={it.staffCode ?? ""}
                        className="h-auto w-full max-w-[130px]"
                      />
                      <p className="mt-1 font-mono text-sm font-bold tracking-[0.18em] text-gray-900">
                        {it.staffCode}
                      </p>
                    </>
                  ) : (
                    <p className="py-10 text-xs text-gray-400">kod yoxdur</p>
                  )}
                </div>
              </div>
              <p className="mt-2 text-center text-[9px] text-gray-400">
                {it.url}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
