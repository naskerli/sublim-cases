import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { OrderStatus } from "@/lib/constants";
import StatCards from "@/components/panel/StatCards";
import OrderList from "@/components/panel/OrderList";

export const dynamic = "force-dynamic";

export default async function StoreDashboard() {
  const user = await requireStoreAdmin();

  const [agg, pending, orders] = await Promise.all([
    prisma.order.aggregate({
      where: { storeId: user.storeId },
      _sum: { total: true, commissionAmount: true },
      _count: true,
    }),
    prisma.order.count({
      where: { storeId: user.storeId, status: OrderStatus.PENDING },
    }),
    prisma.order.findMany({
      where: { storeId: user.storeId },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { store: true, phoneModel: true },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-gray-900">Sifarişlərim</h1>
      <p className="mb-4 text-sm text-gray-500">
        Vitrininizdəki QR koddan gələn bütün sifarişlər.
      </p>

      <StatCards
        stats={[
          { label: "Sifariş", value: String(agg._count) },
          { label: "Gözləyən", value: String(pending) },
          { label: "Satış həcmi", value: formatPrice(agg._sum.total ?? 0) },
          {
            label: "Qazancım",
            value: formatPrice(agg._sum.commissionAmount ?? 0),
          },
        ]}
      />

      <OrderList
        orders={orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          storeName: o.store.name,
          phoneModelName: o.phoneModel.name,
          total: o.total,
          commissionAmount: o.commissionAmount,
          status: o.status,
          createdAt: o.createdAt,
        }))}
        basePath="/store/orders"
        showStore={false}
        commissionLabel="Qazancım"
        emptyText="Hələ sifariş yoxdur. QR kodunuzu vitrinə yerləşdirin."
      />
    </div>
  );
}
