import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { OrderStatusLabel } from "@/lib/constants";
import { formatPrice } from "@/lib/format";

export type OrderRow = {
  id: string;
  orderNumber: string;
  storeName: string;
  phoneModelName: string;
  total: number;
  commissionAmount: number;
  status: string;
  createdAt: Date;
};

// Mobil/planşetdə kart, desktopda cədvəl görünüşü.
// basePath: "/admin/orders" və ya "/store/orders"
export default function OrderList({
  orders,
  basePath,
  showStore = true,
  commissionLabel = "Komissiya",
  emptyText = "Hələ sifariş yoxdur.",
}: {
  orders: OrderRow[];
  basePath: string;
  showStore?: boolean;
  commissionLabel?: string;
  emptyText?: string;
}) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-gray-400">
        {emptyText}
      </div>
    );
  }

  const fmtDate = (d: Date) => d.toLocaleDateString("az-AZ");

  return (
    <>
      {/* Mobil/planşet: kartlar */}
      <div className="space-y-3 md:hidden">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`${basePath}/${o.id}`}
            className="block rounded-xl border border-gray-200 bg-white p-4 active:bg-gray-50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-indigo-600">
                {o.orderNumber}
              </span>
              <StatusBadge status={o.status} label={OrderStatusLabel[o.status]} />
            </div>
            <p className="mt-2 text-sm text-gray-700">{o.phoneModelName}</p>
            {showStore && (
              <p className="text-xs text-gray-500">{o.storeName}</p>
            )}
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-900">
                {formatPrice(o.total)}
              </span>
              <span className="text-gray-500">
                {commissionLabel}: {formatPrice(o.commissionAmount)}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">{fmtDate(o.createdAt)}</p>
          </Link>
        ))}
      </div>

      {/* Desktop: cədvəl */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">Sifariş</th>
              {showStore && (
                <th className="whitespace-nowrap px-4 py-3">Mağaza</th>
              )}
              <th className="whitespace-nowrap px-4 py-3">Model</th>
              <th className="whitespace-nowrap px-4 py-3">Cəmi</th>
              <th className="whitespace-nowrap px-4 py-3">{commissionLabel}</th>
              <th className="whitespace-nowrap px-4 py-3">Status</th>
              <th className="whitespace-nowrap px-4 py-3">Tarix</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3">
                  <Link
                    href={`${basePath}/${o.id}`}
                    className="font-mono font-medium text-indigo-600"
                  >
                    {o.orderNumber}
                  </Link>
                </td>
                {showStore && (
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {o.storeName}
                  </td>
                )}
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                  {o.phoneModelName}
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
                  {fmtDate(o.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
