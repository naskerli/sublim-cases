import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { normalizeCode } from "@/lib/qrcodes";
import StandLogin from "./StandLogin";

export const dynamic = "force-dynamic";

// Stendin ARXA tərəfindəki QR-ın hədəfi — satıcı üçün.
// Kod mağazanı müəyyən edir, sonra şifrə istənilir.
export default async function StandStaffPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const qr = await prisma.qrCode.findUnique({
    where: { staffCode: normalizeCode(code) },
    include: { store: true },
  });

  if (!qr) notFound();

  // Artıq giriş edibsə birbaşa hesabata keçsin
  const user = await getSessionUser();
  if (user && qr.storeId && user.storeId === qr.storeId) {
    redirect("/store");
  }

  const store = qr.store;
  if (!qr.active || !store || !store.active) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <span className="text-5xl">🚧</span>
        <h1 className="mt-5 text-xl font-bold text-gray-900">
          Bu stend hələ aktiv deyil
        </h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-600">
          Stend hələ mağazaya bağlanmayıb. Quraşdırma tamamlandıqdan sonra
          hesabata bu koddan giriş edə biləcəksiniz.
        </p>
        <p className="mt-6 rounded-lg bg-white px-4 py-2 font-mono text-sm font-semibold tracking-widest text-gray-700">
          {qr.staffCode}
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-gray-50 px-5">
      <StandLogin staffCode={qr.staffCode!} storeName={store.name} />
    </main>
  );
}
