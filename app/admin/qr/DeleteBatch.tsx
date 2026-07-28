"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteBatch({
  batch,
  total,
  withOrders,
}: {
  batch: string;
  total: number;
  withOrders: number;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/qr/batch", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult(data.error ?? "Silinmədi.");
        return;
      }
      setConfirming(false);
      if (data.kept > 0) {
        setResult(
          `${data.deleted} kod silindi. ${data.kept} kod saxlanıldı — onlardan sifariş gəlib.`,
        );
      }
      router.push("/admin/qr");
      router.refresh();
    } catch {
      setResult("Şəbəkə xətası.");
    } finally {
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={() => setConfirming(true)}
          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
        >
          Partiyanı sil
        </button>
        {result && <p className="text-xs text-gray-500">{result}</p>}
      </div>
    );
  }

  const deletable = total - withOrders;

  return (
    <div className="w-full rounded-xl border border-red-200 bg-red-50 p-3 sm:w-auto">
      <p className="text-sm font-semibold text-red-800">
        &quot;{batch}&quot; partiyası silinsin?
      </p>
      <p className="mt-1 text-xs text-red-700">
        {deletable} kod silinəcək.
        {withOrders > 0 && (
          <>
            {" "}
            {withOrders} kod saxlanılacaq — onlardan sifariş gəlib, silinsə
            tarixçə itərdi.
          </>
        )}
      </p>
      <p className="mt-1 text-xs text-red-600">
        Çap olunmuş stendlər varsa onların QR-ları işləməyəcək.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          disabled={busy}
          onClick={remove}
          className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Silinir…" : "Bəli, sil"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-600"
        >
          Ləğv et
        </button>
      </div>
    </div>
  );
}
