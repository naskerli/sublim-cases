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

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {c.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Sifariş</th>
              <th className="px-4 py-3">Mağaza</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Cəmi</th>
              <th className="px-4 py-3">Komissiya</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tarix</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Hələ sifariş yoxdur.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-mono font-medium text-indigo-600"
                  >
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">{o.store.name}</td>
                <td className="px-4 py-3 text-gray-700">{o.phoneModel.name}</td>
                <td className="px-4 py-3 font-medium">{formatPrice(o.total)}</td>
                <td className="px-4 py-3 text-gray-600">
                  {formatPrice(o.commissionAmount)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} label={OrderStatusLabel[o.status]} />
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {o.createdAt.toLocaleDateString("az-AZ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
