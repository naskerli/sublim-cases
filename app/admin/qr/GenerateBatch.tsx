"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GenerateBatch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(20);
  const [batch, setBatch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, batch }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kodlar yaradılmadı.");
        return;
      }
      setOpen(false);
      setBatch("");
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
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white active:bg-indigo-700"
      >
        + Yeni partiya
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="w-full rounded-xl border border-gray-200 bg-white p-4 sm:w-auto"
    >
      <p className="mb-3 text-sm font-semibold text-gray-900">
        Yeni QR partiyası
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Say</label>
          <input
            type="number"
            min={1}
            max={200}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value || "1", 10))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:w-24"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">
            Partiya adı (istəyə bağlı)
          </label>
          <input
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            placeholder="2026-07-A"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:w-44"
          />
        </div>
        <div className="flex gap-2">
          <button
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Yaradılır…" : "Yarat"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-600"
          >
            Ləğv
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </form>
  );
}
