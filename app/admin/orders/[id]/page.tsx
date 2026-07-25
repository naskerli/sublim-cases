import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrderDetail from "@/components/panel/OrderDetail";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      store: true,
      phoneModel: true,
      pickupPoint: true,
      addons: { include: { product: true } },
    },
  });
  if (!order) notFound();

  return <OrderDetail order={order} backHref="/admin/orders" />;
}
