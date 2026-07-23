import { redirect } from "next/navigation";
import Link from "next/link";
import { isAuthed } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthed())) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-6">
          <span className="font-bold text-gray-900">
            Sublim<span className="hidden sm:inline"> Admin</span>
          </span>
          <nav className="flex gap-3 text-sm sm:gap-4">
            <Link href="/admin" className="text-gray-600 hover:text-indigo-600">
              Sifarişlər
            </Link>
            <Link
              href="/admin/stores"
              className="text-gray-600 hover:text-indigo-600"
            >
              Mağazalar
            </Link>
          </nav>
          <div className="ml-auto">
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 sm:py-6">{children}</main>
    </div>
  );
}
