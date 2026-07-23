"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderStatus, OrderStatusLabel } from "@/lib/constants";

export default function StatusControl({
  orderId,
  current,
}: {
  orderId: string;
  current: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [saving, setSaving] = useState(false);

  async function update(next: string) {
    setStatus(next);
    setSaving(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => update(e.target.value)}
        disabled={saving}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm sm:w-auto sm:py-2"
      >
        {Object.values(OrderStatus).map((s) => (
          <option key={s} value={s}>
            {OrderStatusLabel[s]}
          </option>
        ))}
      </select>
      {saving && (
        <span className="shrink-0 text-xs text-gray-400">Saxlanılır…</span>
      )}
    </div>
  );
}
