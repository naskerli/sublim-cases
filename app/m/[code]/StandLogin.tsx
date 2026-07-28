"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StandLogin({
  staffCode,
  storeName,
}: {
  staffCode: string;
  storeName: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/stand-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffCode, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Giriş alınmadı.");
        return;
      }
      router.push(data.redirectTo ?? "/store");
      router.refresh();
    } catch {
      setError("Şəbəkə xətası. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="text-center">
          <span className="text-4xl">🏪</span>
          <h1 className="mt-3 text-lg font-bold text-gray-900">
            Satış hesabatı
          </h1>
          <p className="mt-1 text-sm font-medium text-indigo-600">
            {storeName}
          </p>
        </div>

        <label className="mt-6 block text-sm font-medium text-gray-700">
          Şifrə
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-sm"
          placeholder="Mağaza şifrəniz"
        />

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Yoxlanılır…" : "Hesabatı aç"}
        </button>

        <p className="mt-4 text-center text-xs text-gray-400">
          Şifrəni unutmusunuzsa platforma ilə əlaqə saxlayın
        </p>
      </div>
    </form>
  );
}
