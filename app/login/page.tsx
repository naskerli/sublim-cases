"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Giriş alınmadı.");
        return;
      }
      router.push(data.redirectTo ?? "/");
      router.refresh();
    } catch {
      setError("Şəbəkə xətası. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 block text-center text-lg font-bold text-gray-900"
        >
          Sublim<span className="text-indigo-600">Cases</span>
        </Link>

        <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">Panelə giriş</h1>
          <p className="mt-1 text-sm text-gray-500">
            Mağaza və ya platforma hesabınızla daxil olun
          </p>

          <label className="mt-5 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            placeholder="ad@nümunə.az"
          />

          <label className="mt-4 block text-sm font-medium text-gray-700">
            Şifrə
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          />

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Daxil olunur…" : "Daxil ol"}
          </button>
        </form>
      </div>
    </div>
  );
}
