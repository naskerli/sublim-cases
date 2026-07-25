import { prisma } from "@/lib/prisma";
import OrderList from "@/components/panel/OrderList";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { store: true, phoneModel: true },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">
        Bütün sifarişlər
      </h1>
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
        basePath="/admin/orders"
      />
    </div>
  );
}
