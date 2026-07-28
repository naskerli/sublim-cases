import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrderPage from "@/components/order/OrderPage";

export const dynamic = "force-dynamic";

// Birbaşa mağaza linki. Fiziki stendlərdə QR kod (/q/<code>) istifadə olunur;
// bu marşrut daxili test və köhnə linklər üçün saxlanılır.
export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store || !store.active) notFound();

  return (
    <OrderPage
      store={{ slug: store.slug, name: store.name, city: store.city }}
    />
  );
}
