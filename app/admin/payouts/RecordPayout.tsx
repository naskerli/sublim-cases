"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RecordPayout({
  storeId,
  storeName,
  pending,
  orderCount,
  ready,
}: {
  storeId: string;
  storeName: string;
  pending: number;
  orderCount: number;
  ready: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"CASH" | "BANK">("CASH");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, method, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Qeydə alınmadı.");
        return;
      }
      setOpen(false);
      setNote("");
      router.refresh();
    } catch {
      setError("Şəbəkə xətası.");
    } finally {
      setBusy(false);
    }
  }

  if (pending <= 0) {
    return <span className="text-xs text-gray-400">borc yoxdur</span>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`rounded-lg px-3 py-2 text-xs font-semibold ${
          ready
            ? "bg-emerald-600 text-white active:bg-emerald-700"
            : "border border-gray-300 bg-white text-gray-500 active:bg-gray-50"
        }`}
      >
        {ready ? "Ödənişi qeyd et" : "Həddən əvvəl ödə"}
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-3"
    >
      <p className="text-sm font-semibold text-emerald-900">
        {storeName} — {pending.toFixed(2)} ₼
      </p>
      <p className="mt-0.5 text-xs text-emerald-700">
        {orderCount} sifarişin komissiyası bağlanacaq
      </p>

      <div className="mt-3 flex gap-1.5">
        {(["CASH", "BANK"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              method === m
                ? "bg-emerald-600 text-white"
                : "bg-white text-gray-600"
            }`}
          >
            {m === "CASH" ? "Nağd" : "Köçürmə"}
          </button>
        ))}
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Qeyd (kimə verildi, tarix…)"
        className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2 text-xs"
      />

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          disabled={busy}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Qeyd olunur…" : "Təsdiq et"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-600"
        >
          Ləğv
        </button>
      </div>
    </form>
  );
}
