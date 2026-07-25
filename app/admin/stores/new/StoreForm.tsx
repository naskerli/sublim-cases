"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Ad → slug (QR linkində istifadə olunur)
function slugify(s: string): string {
  const map: Record<string, string> = {
    ə: "e", ı: "i", ö: "o", ü: "u", ç: "c", ş: "s", ğ: "g",
    Ə: "e", I: "i", İ: "i", Ö: "o", Ü: "u", Ç: "c", Ş: "s", Ğ: "g",
  };
  return s
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export default function StoreForm() {
  const router = useRouter();
  const [f, setF] = useState({
    name: "",
    slug: "",
    city: "",
    address: "",
    contactName: "",
    contactPhone: "",
    commissionPercent: 15,
    adminEmail: "",
    adminName: "",
    adminPassword: "",
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof f>(key: K, value: (typeof f)[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.name,
          slug: f.slug,
          city: f.city,
          address: f.address,
          contactName: f.contactName,
          contactPhone: f.contactPhone,
          commissionRate: f.commissionPercent / 100,
          adminEmail: f.adminEmail,
          adminName: f.adminName,
          adminPassword: f.adminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Mağaza yaradıla bilmədi.");
        return;
      }
      router.push(`/admin/stores/${data.storeId}`);
      router.refresh();
    } catch {
      setError("Şəbəkə xətası.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Mağaza məlumatları
        </h2>
        <div className="space-y-3">
          <Field
            label="Mağaza adı *"
            value={f.name}
            onChange={(v) => {
              set("name", v);
              if (!slugTouched) set("slug", slugify(v));
            }}
            placeholder="MobiStyle — Gənclik Mall"
            required
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              QR linki (slug) *
            </label>
            <div className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2.5">
              <span className="shrink-0 text-sm text-gray-400">/s/</span>
              <input
                value={f.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
                required
                className="w-full text-sm outline-none"
                placeholder="gencluk-mall"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Şəhər"
              value={f.city}
              onChange={(v) => set("city", v)}
              placeholder="Bakı"
            />
            <Field
              label="Ünvan"
              value={f.address}
              onChange={(v) => set("address", v)}
              placeholder="Gənclik Mall, 2-ci mərtəbə"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Əlaqədar şəxs"
              value={f.contactName}
              onChange={(v) => set("contactName", v)}
            />
            <Field
              label="Telefon"
              value={f.contactPhone}
              onChange={(v) => set("contactPhone", v)}
              placeholder="+994 __ ___ __ __"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Komissiya: {f.commissionPercent}%
            </label>
            <input
              type="range"
              min={0}
              max={40}
              step={1}
              value={f.commissionPercent}
              onChange={(e) =>
                set("commissionPercent", parseInt(e.target.value, 10))
              }
              className="w-full accent-indigo-600"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Mağaza admini</h2>
        <p className="mb-3 mt-1 text-xs text-gray-500">
          İstəyə bağlı — sonra da təyin edə bilərsiniz. Bu hesabla mağaza öz
          sifarişlərini görəcək.
        </p>
        <div className="space-y-3">
          <Field
            label="Admin adı"
            value={f.adminName}
            onChange={(v) => set("adminName", v)}
          />
          <Field
            label="Email"
            type="email"
            value={f.adminEmail}
            onChange={(v) => set("adminEmail", v)}
            placeholder="magaza@nümunə.az"
          />
          <Field
            label="Şifrə (min. 6 simvol)"
            type="password"
            value={f.adminPassword}
            onChange={(v) => set("adminPassword", v)}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        disabled={saving}
        className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {saving ? "Yaradılır…" : "Mağazanı qeydiyyata al"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
      />
    </div>
  );
}
