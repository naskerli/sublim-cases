import Link from "next/link";
import LogoutButton from "./LogoutButton";

export type NavItem = { href: string; label: string };

// Hər iki panel (platforma və mağaza) üçün ümumi çərçivə.
export default function PanelShell({
  brand,
  badge,
  nav,
  children,
}: {
  brand: string;
  badge?: string | null;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-3 py-3">
            <span className="font-bold text-gray-900">{brand}</span>
            {badge && (
              <span className="hidden max-w-[45%] truncate rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 sm:inline-block">
                {badge}
              </span>
            )}
            <div className="ml-auto">
              <LogoutButton />
            </div>
          </div>
          <nav className="-mb-px flex gap-4 overflow-x-auto text-sm">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="whitespace-nowrap border-b-2 border-transparent pb-2.5 text-gray-600 hover:border-indigo-500 hover:text-indigo-600"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 sm:py-6">{children}</main>
    </div>
  );
}
