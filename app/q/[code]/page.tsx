import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeCode } from "@/lib/qrcodes";
import OrderPage from "@/components/order/OrderPage";

export const dynamic = "force-dynamic";

// Stend üzərindəki QR kodun hədəfi.
// Kod mağazaya təyin olunubsa sifariş sihirbazı açılır; təyin olunmayıbsa
// sifariş qəbul edilmir — komissiyanın kimə yazılacağı bilinmədən sifariş
// yaratmaq sonradan əl ilə düzəliş tələb edərdi.
export default async function QrPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalized = normalizeCode(code);

  const qr = await prisma.qrCode.findUnique({
    where: { code: normalized },
    include: { store: true },
  });

  if (!qr) notFound();

  const store = qr.store;
  const ready = qr.active && store && store.active;

  if (!ready) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-6 text-center">
        <span className="text-5xl">🚧</span>
        <h1 className="mt-5 text-xl font-bold text-gray-900">
          Bu stend hələ aktiv deyil
        </h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-600">
          Kod sistemdə var, amma hələ mağazaya bağlanmayıb. Zəhmət olmasa bir
          az sonra yenidən yoxlayın və ya mağaza əməkdaşına müraciət edin.
        </p>
        <p className="mt-6 rounded-lg bg-gray-100 px-4 py-2 font-mono text-sm font-semibold tracking-widest text-gray-700">
          {qr.code}
        </p>
        <p className="mt-2 text-xs text-gray-400">
          Dəstəyə müraciət edərkən bu kodu bildirin
        </p>
      </main>
    );
  }

  return (
    <OrderPage
      store={{ slug: store.slug, name: store.name, city: store.city }}
      qrCode={qr.code}
    />
  );
}
