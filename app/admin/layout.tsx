import { requirePlatformAdmin } from "@/lib/auth";
import PanelShell from "@/components/panel/PanelShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePlatformAdmin();

  return (
    <PanelShell
      brand="Sublim Platforma"
      badge={user.email}
      nav={[
        { href: "/admin", label: "İcmal" },
        { href: "/admin/orders", label: "Sifarişlər" },
        { href: "/admin/stores", label: "Mağazalar" },
      ]}
    >
      {children}
    </PanelShell>
  );
}
