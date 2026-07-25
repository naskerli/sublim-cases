import { requireStoreAdmin } from "@/lib/auth";
import PanelShell from "@/components/panel/PanelShell";

export const dynamic = "force-dynamic";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStoreAdmin();

  return (
    <PanelShell
      brand="Sublim Mağaza"
      badge={user.storeName}
      nav={[
        { href: "/store", label: "Sifarişlərim" },
        { href: "/store/qr", label: "QR kodum" },
      ]}
    >
      {children}
    </PanelShell>
  );
}
