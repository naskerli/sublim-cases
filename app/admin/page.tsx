import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import StatCards from "@/components/panel/StatCards";
import OrderList from "@/components/panel/OrderList";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [agg, storeCount, activeStores, recent] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true, commissionAmount: true },
      _count: true,
    }),
    prisma.store.count(),
    prisma.store.count({ where: { active: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { store: true, phoneModel: true },
    }),
  ]);

  const revenue = agg._sum.total ?? 0;
  const commission = agg._sum.commissionAmount ?? 0;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">İcmal</h1>

      <StatCards
        stats={[
          { label: "Sifariş", value: String(agg._count) },
          { label: "Dövriyyə", value: formatPrice(revenue) },
          { label: "Komissiya", value: formatPrice(commission) },
          {
            label: "Xalis gəlir",
            value: formatPrice(revenue - commission),
          },
        ]}
      />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:gap-3">
        <Link
          href="/admin/stores/new"
          className="rounded-xl bg-indigo-600 p-4 text-center text-sm font-semibold text-white active:bg-indigo-700"
        >
          + Yeni mağaza qeydiyyatı
        </Link>
        <Link
          href="/admin/stores"
          className="rounded-xl border border-gray-200 bg-white p-4 text-center text-sm font-semibold text-gray-700 active:bg-gray-50"
        >
          Mağazalar ({activeStores}/{storeCount} aktiv)
        </Link>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Son sifarişlər</h2>
        <Link href="/admin/orders" className="text-sm text-indigo-600">
          Hamısı →
        </Link>
      </div>

      <OrderList
        orders={recent.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          storeName: o.store.name,
          phoneModelName: o.phoneModel.name,
          total: o.total,
          commissionAmount: o.commissionAmount,
          status: o.status,
          createdAt: o.createdAt,
        }))}
        basePath="/admin/orders"
      />
    </div>
  );
}
