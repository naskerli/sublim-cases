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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3 print:gap-3">
          {items.map((it) => (
            <div
              key={it.code}
              className="flex break-inside-avoid flex-col items-center rounded-lg border border-gray-300 p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.qr}
                alt={it.code}
                className="h-auto w-full max-w-[150px]"
              />
              <p className="mt-2 font-mono text-base font-bold tracking-[0.2em] text-gray-900">
                {it.code}
              </p>
              <p className="mt-0.5 text-[9px] text-gray-400">{it.url}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
