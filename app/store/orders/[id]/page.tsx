import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import OrderDetail from "@/components/panel/OrderDetail";

export const dynamic = "force-dynamic";

export default async function StoreOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStoreAdmin();
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

  // Başqa mağazanın sifarişi görünməsin.
  if (!order || order.storeId !== user.storeId) notFound();

  return (
    <OrderDetail
      order={order}
      backHref="/store"
      backLabel="Sifarişlərimə qayıt"
      commissionTitle="Qazancım"
      showStoreName={false}
    />
  );
}
