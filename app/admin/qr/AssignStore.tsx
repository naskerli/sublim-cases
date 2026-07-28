"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type StoreOption = { id: string; name: string };

// QR kodu mağazaya təyin edir / təyinatı geri alır.
export default function AssignStore({
  qrId,
  currentStoreId,
  stores,
}: {
  qrId: string;
  currentStoreId: string | null;
  stores: StoreOption[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function change(storeId: string) {
    setSaving(true);
    await fetch(`/api/admin/qr/${qrId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: storeId || null }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <select
      value={currentStoreId ?? ""}
      disabled={saving}
      onChange={(e) => change(e.target.value)}
      className={`w-full rounded-lg border px-2.5 py-2 text-xs ${
        currentStoreId
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-amber-300 bg-amber-50 text-amber-800"
      } disabled:opacity-50`}
    >
      <option value="">— Təyin olunmayıb —</option>
      {stores.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
