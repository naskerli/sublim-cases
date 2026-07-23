import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { OrderStatusLabel } from "@/lib/constants";
import StatusBadge from "./StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const [orders, agg] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { store: true, phoneModel: true },
    }),
    prisma.order.aggregate({
      _sum: { total: true, commissionAmount: true },
      _count: true,
    }),
  ]);

  const cards = [
    { label: "Sifariş sayı", value: String(agg._count) },
    { label: "Ümumi dövriyyə", value: formatPrice(agg._sum.total ?? 0) },
    {
      label: "Ümumi komissiya",
      value: formatPrice(agg._sum.commissionAmount ?? 0),
    },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">Sifarişlər</h1>

      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4"
          >
            <p className="text-[10px] uppercase tracking-wide text-gray-400 sm:text-xs">
              {c.label}
            </p>
            <p className="mt-1 text-lg font-bold text-gray-900 sm:text-2xl">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-gray-400">
          Hələ sifariş yoxdur.
        </div>
      )}

      {/* Mobil/planşet: kart görünüşü */}
      <div className="space-y-3 md:hidden">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/admin/orders/${o.id}`}
            className="block rounded-xl border border-gray-200 bg-white p-4 active:bg-gray-50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-indigo-600">
                {o.orderNumber}
              </span>
              <StatusBadge status={o.status} label={OrderStatusLabel[o.status]} />
            </div>
            <p className="mt-2 text-sm text-gray-700">{o.phoneModel.name}</p>
            <p className="text-xs text-gray-500">{o.store.name}</p>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-900">
                {formatPrice(o.total)}
              </span>
              <span className="text-gray-500">
                Komissiya: {formatPrice(o.commissionAmount)}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {o.createdAt.toLocaleDateString("az-AZ")}
            </p>
          </Link>
        ))}
      </div>

      {/* Desktop: cədvəl */}
      {orders.length > 0 && (
        <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">Sifariş</th>
                <th className="whitespace-nowrap px-4 py-3">Mağaza</th>
                <th className="whitespace-nowrap px-4 py-3">Model</th>
                <th className="whitespace-nowrap px-4 py-3">Cəmi</th>
                <th className="whitespace-nowrap px-4 py-3">Komissiya</th>
                <th className="whitespace-nowrap px-4 py-3">Status</th>
                <th className="whitespace-nowrap px-4 py-3">Tarix</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-mono font-medium text-indigo-600"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {o.store.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {o.phoneModel.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    {formatPrice(o.total)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {formatPrice(o.commissionAmount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge
                      status={o.status}
                      label={OrderStatusLabel[o.status]}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {o.createdAt.toLocaleDateString("az-AZ")}
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
