"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddAdminForm({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Admin təyin edilmədi.");
        return;
      }
      setF({ name: "", email: "", password: "" });
      setOpen(false);
      router.refresh();
    } catch {
      setError("Şəbəkə xətası.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 rounded-lg border border-indigo-300 px-4 py-2.5 text-xs font-semibold text-indigo-700 active:bg-indigo-50"
      >
        + Admin təyin et
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-lg bg-gray-50 p-3">
      <input
        value={f.name}
        onChange={(e) => setF({ ...f, name: e.target.value })}
        placeholder="Ad (istəyə bağlı)"
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
      />
      <input
        type="email"
        value={f.email}
        onChange={(e) => setF({ ...f, email: e.target.value })}
        placeholder="Email"
        required
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
      />
      <input
        type="password"
        value={f.password}
        onChange={(e) => setF({ ...f, password: e.target.value })}
        placeholder="Şifrə (min. 6 simvol)"
        required
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Əlavə olunur…" : "Əlavə et"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-xs font-medium text-gray-600"
        >
          Ləğv et
        </button>
      </div>
    </form>
  );
}
