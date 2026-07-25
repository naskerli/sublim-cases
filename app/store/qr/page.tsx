import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { getBaseUrl } from "@/lib/qr";
import QrCard from "@/components/panel/QrCard";

export const dynamic = "force-dynamic";

export default async function StoreQrPage() {
  const user = await requireStoreAdmin();

  const [store, baseUrl] = await Promise.all([
    prisma.store.findUnique({ where: { id: user.storeId } }),
    getBaseUrl(),
  ]);
  if (!store) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-xl font-bold text-gray-900">QR kodum</h1>
      <p className="mb-5 text-sm text-gray-500">
        Müştəri bu kodu skan edəndə birbaşa sifariş səhifəsinə düşür və
        sifariş sizin mağazanıza yazılır.
      </p>
      <QrCard
        baseUrl={baseUrl}
        slug={store.slug}
        hint="Yükləyib çap edin və vitrində görünən yerə yerləşdirin."
      />
    </div>
  );
}
