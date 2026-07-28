import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBaseUrl, standUrl } from "@/lib/qr";
import StatCards from "@/components/panel/StatCards";
import GenerateBatch from "./GenerateBatch";
import AssignStore from "./AssignStore";

export const dynamic = "force-dynamic";

export default async function AdminQrPage({
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

  const [codes, stores, total, assigned, batchRows, baseUrl] =
    await Promise.all([
      prisma.qrCode.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 300,
        include: {
          store: { select: { id: true, name: true } },
          _count: { select: { orders: true } },
        },
      }),
      prisma.store.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.qrCode.count(),
      prisma.qrCode.count({ where: { NOT: { storeId: null } } }),
      prisma.qrCode.findMany({
        where: { NOT: { batch: null } },
        distinct: ["batch"],
        select: { batch: true },
        orderBy: { batch: "desc" },
      }),
      getBaseUrl(),
    ]);

  const batches = batchRows
    .map((b) => b.batch)
    .filter((b): b is string => !!b);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">QR stendlər</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kodlar əvvəlcədən yaradılır və stendlərə çap olunur. Mağaza ilə
            razılaşdıqda kodu ona təyin edin.
          </p>
        </div>
        <GenerateBatch />
      </div>

      <StatCards
        stats={[
          { label: "Ümumi kod", value: String(total) },
          { label: "Təyin olunub", value: String(assigned) },
          { label: "Boşdur", value: String(total - assigned) },
        ]}
      />

      {/* Filtrlər */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterLink href="/admin/qr" active={!sp.status && !sp.batch}>
          Hamısı
        </FilterLink>
        <FilterLink href="/admin/qr?status=free" active={sp.status === "free"}>
          Boş
        </FilterLink>
        <FilterLink
          href="/admin/qr?status=assigned"
          active={sp.status === "assigned"}
        >
          Təyin olunmuş
        </FilterLink>
        {batches.map((b) => (
          <FilterLink
            key={b}
            href={`/admin/qr?batch=${encodeURIComponent(b)}`}
            active={sp.batch === b}
          >
            {b}
          </FilterLink>
        ))}
        {(sp.batch || sp.status) && (
          <Link
            href={`/admin/qr/print${sp.batch ? `?batch=${encodeURIComponent(sp.batch)}` : sp.status ? `?status=${sp.status}` : ""}`}
            className="ml-auto rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700"
          >
            🖨 Bu seçimi çap et
          </Link>
        )}
      </div>

      {codes.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-gray-400">
          Kod yoxdur. &quot;Yeni partiya&quot; ilə başlayın.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">Kod</th>
                <th className="whitespace-nowrap px-4 py-3">Mağaza</th>
                <th className="whitespace-nowrap px-4 py-3">Partiya</th>
                <th className="whitespace-nowrap px-4 py-3">Sifariş</th>
                <th className="whitespace-nowrap px-4 py-3">Link</th>
                <th className="whitespace-nowrap px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="font-mono text-sm font-bold tracking-widest text-gray-900">
                      {c.code}
                    </span>
                  </td>
                  <td className="min-w-[190px] px-4 py-3">
                    <AssignStore
                      qrId={c.id}
                      currentStoreId={c.store?.id ?? null}
                      stores={stores}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {c.batch ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {c._count.orders}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">
                    /q/{c.code}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <a
                      href={`/api/admin/qr/${c.id}/png`}
                      download
                      className="text-xs font-semibold text-indigo-600"
                    >
                      PNG
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400">
        Skan ünvanı: <span className="font-mono">{standUrl(baseUrl, "KOD")}</span>
      </p>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
        active
          ? "bg-gray-900 text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {children}
    </Link>
  );
}
