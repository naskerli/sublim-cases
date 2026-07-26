"use client";

import { useMemo, useRef, useState } from "react";
import {
  CaseCanvas,
  type CaseCanvasHandle,
  type PhotoTransform,
  type TextOptions,
} from "./CaseCanvas";
import type {
  PhoneModelDTO,
  PickupPointDTO,
  ProductDTO,
  StoreDTO,
} from "@/lib/types";
import { SHIPPING_FEE } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { haversineKm } from "@/lib/geo";

type Props = {
  store: StoreDTO;
  phoneModels: PhoneModelDTO[];
  caseProduct: ProductDTO;
  addons: ProductDTO[];
  pickupPoints: PickupPointDTO[];
};

const FONTS = [
  { label: "Klassik", value: "Arial, sans-serif" },
  { label: "Zərif", value: "Georgia, serif" },
  { label: "Dəyirmi", value: "'Trebuchet MS', sans-serif" },
  { label: "Monospace", value: "'Courier New', monospace" },
];

const COLORS = ["#ffffff", "#000000", "#ff3b6b", "#ffd400", "#00d1b2", "#6c5ce7"];

// Mətn fonu üçün seçimlər
const TEXT_BACKGROUNDS: { value: TextOptions["bg"]; label: string }[] = [
  { value: "none", label: "Fonsuz" },
  { value: "solid", label: "Sadə" },
  { value: "blur", label: "Blur" },
];

const BG_COLORS = ["#000000", "#ffffff"];

const STEPS = ["Model & Şəkil", "Dizayn", "Aksesuarlar", "Çatdırılma", "Təsdiq"];

// Dizayn addımının daxili tabları
const DESIGN_TABS = [
  { label: "Tərz", icon: "✨" },
  { label: "Yerləşdir", icon: "🎯" },
  { label: "Yazı", icon: "✍️" },
];

// Yükləmə addımında növbələşən CTA kartları.
// Hər kartın öz qradienti və mesaja uyğun düzülüşü (variant) var.
const UPLOAD_MESSAGES = [
  {
    variant: "design" as const,
    icon: "🎨",
    title: "Sən seç, biz çap edək",
    text: "Ekranda gördüyün dizayn kabronun üzərinə eynilə köçürülür",
    card: "from-indigo-500 via-purple-500 to-fuchsia-500",
    glow: "bg-fuchsia-300/40",
  },
  {
    variant: "gift" as const,
    icon: "🎁",
    title: "Əla hədiyyə olur",
    text: "Ad günü, ildönümü və xüsusi tarixlər üçün fərdi seçim",
    card: "from-rose-500 via-pink-500 to-orange-400",
    glow: "bg-amber-300/40",
  },
  {
    variant: "delivery" as const,
    icon: "🚚",
    title: "Sənə ən yaxın nöqtəyə",
    text: "Sifarişini seçdiyin pickup məntəqəsindən rahat götür",
    card: "from-sky-500 via-cyan-500 to-emerald-400",
    glow: "bg-cyan-200/40",
  },
];

// AI tərzləri — hələ qoşulmayıb, yalnız "Orijinal" aktivdir.
// AI xidməti qoşulduqda bura model/prompt bağlanacaq.
const AI_STYLES = [
  { id: "original", label: "Orijinal", emoji: "🖼️", available: true },
  { id: "anime", label: "Anime", emoji: "🌸", available: false },
  { id: "sketch", label: "Sketch", emoji: "✏️", available: false },
  { id: "cartoon", label: "Cartoon", emoji: "🎨", available: false },
  { id: "popart", label: "Pop Art", emoji: "💥", available: false },
  { id: "oil", label: "Yağlı boya", emoji: "🖌️", available: false },
];

export default function OrderWizard({
  store,
  phoneModels,
  caseProduct,
  addons,
  pickupPoints,
}: Props) {
  const [step, setStep] = useState(0);

  // Step 1
  const [brand, setBrand] = useState(phoneModels[0]?.brand ?? "");
  const [modelId, setModelId] = useState("");
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Step 2
  const [transform, setTransform] = useState<PhotoTransform>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [text, setText] = useState<TextOptions>({
    text: "",
    font: FONTS[0].value,
    color: "#ffffff",
    size: 42,
    x: 0.5,
    y: 0.8,
    bg: "none",
    bgColor: "#000000",
    border: false,
  });

  // Dizayn addımının aktiv tabı (0: tərz, 1: yerləşdir, 2: yazı)
  const [designTab, setDesignTab] = useState(0);

  // Step 3
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});

  // Step 4
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [city, setCity] = useState(store.city ?? "Bakı");
  const [pickupId, setPickupId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "CARD" | "CASH_ON_DELIVERY"
  >("CASH_ON_DELIVERY");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const canvasRef = useRef<CaseCanvasHandle>(null);

  const brands = useMemo(
    () => Array.from(new Set(phoneModels.map((m) => m.brand))),
    [phoneModels],
  );
  const modelsForBrand = phoneModels.filter((m) => m.brand === brand);
  const selectedModel = phoneModels.find((m) => m.id === modelId) ?? null;

  const cities = useMemo(
    () => Array.from(new Set(pickupPoints.map((p) => p.city))),
    [pickupPoints],
  );
  const pointsForCity = useMemo(
    () => pickupPoints.filter((p) => p.city === city),
    [pickupPoints, city],
  );

  // Ən yaxın pickup məntəqəsini təklif et (şəhər mərkəzinə görə sadə sıralama).
  const suggestedPoint = pointsForCity[0] ?? null;

  const addonsTotal = addons.reduce(
    (sum, a) => sum + (addonQty[a.id] ?? 0) * a.price,
    0,
  );
  const total = caseProduct.price + addonsTotal + SHIPPING_FEE;

  // Həm fayl seçimi, həm drag & drop bu funksiyadan keçir.
  function acceptFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Zəhmət olmasa şəkil faylı seçin.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Şəkil çox böyükdür (maksimum 10 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoSrc(reader.result as string);
      setPhotoName(file.name);
    };
    reader.readAsDataURL(file);
    setError(null);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) acceptFile(file);
  }

  function canNext(): boolean {
    if (step === 0) return !!modelId && !!photoSrc;
    if (step === 3)
      return (
        customer.name.trim().length > 1 &&
        customer.phone.trim().length >= 7 &&
        !!pickupId
      );
    return true;
  }

  async function submitOrder() {
    setSubmitting(true);
    setError(null);
    try {
      const designImage = canvasRef.current?.toDataURL() ?? null;
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug: store.slug,
          phoneModelId: modelId,
          uploadedImage: photoSrc,
          designImage,
          customText: text.text || null,
          textOptions: text,
          addons: Object.entries(addonQty)
            .filter(([, q]) => q > 0)
            .map(([productId, quantity]) => ({ productId, quantity })),
          customer,
          pickupPointId: pickupId,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sifariş göndərilmədi.");
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setOrderNumber(data.orderNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi.");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Uğur ekranı ---
  if (orderNumber) {
    return (
      <div className="mx-auto max-w-md text-center py-16 px-4">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Sifarişiniz alındı!</h1>
        <p className="mt-2 text-gray-600">
          Sifariş nömrəniz:{" "}
          <span className="font-mono font-semibold text-gray-900">
            {orderNumber}
          </span>
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Kabronuz istehsala verildi. Hazır olduqda seçdiyiniz pickup
          məntəqəsindən götürə bilərsiniz. Əlaqə üçün sizinlə əlaqə saxlayacağıq.
        </p>
      </div>
    );
  }

  const shape = selectedModel?.shape;

  // --- Başlanğıc addımı: model seçimi + şəkil yükləmə (tam ekran, scroll-suz) ---
  if (step === 0) {
    return (
      <div className="flex h-[100dvh] flex-col bg-white">
        {/* Başlıq */}
        <div className="shrink-0 px-4 pt-5 text-center">
          <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
            {store.name}
          </span>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-gray-900">
            Özəl kabronu yarat
          </h1>
        </div>

        {/* Addım göstəricisi */}
        <div className="shrink-0 px-4 pt-3">
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-indigo-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Marka */}
        <div className="shrink-0 px-4 pt-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Marka
          </p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => {
                  setBrand(b);
                  setModelId("");
                }}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  brand === b
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 active:bg-gray-200"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div className="shrink-0 px-4 pt-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Model
          </p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {modelsForBrand.map((m) => (
              <button
                key={m.id}
                onClick={() => setModelId(m.id)}
                className={`shrink-0 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all ${
                  modelId === m.id
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                    : "border-gray-200 text-gray-600 active:bg-gray-50"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* Şəkil yükləmə — kompakt */}
        <div className="shrink-0 px-4 pt-4">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) acceptFile(file);
            }}
            className={`relative flex h-[104px] cursor-pointer rounded-2xl p-[2px] transition-transform ${
              photoSrc
                ? "bg-emerald-400"
                : `sc-anim-gradient bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-500 ${
                    dragging ? "scale-[1.02]" : ""
                  }`
            }`}
          >
            <div
              className={`flex h-full w-full items-center gap-4 rounded-[14px] px-4 transition-colors ${
                photoSrc
                  ? "bg-emerald-50"
                  : dragging
                    ? "bg-indigo-50"
                    : "bg-white"
              }`}
            >
              {photoSrc ? (
                <>
                  <span className="sc-pop shrink-0 text-3xl">✅</span>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-bold text-gray-900">
                      Şəkil hazırdır
                    </p>
                    {photoName && (
                      <p className="truncate text-xs text-gray-500">
                        {photoName}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-indigo-600 shadow-sm">
                    Dəyişdir
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                    <span className="sc-pulse-ring absolute inset-0 rounded-full bg-indigo-400/30" />
                    <span className="sc-bob relative text-3xl">📸</span>
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-bold text-gray-900">
                      Şəklini yüklə
                    </p>
                    <p className="text-xs text-gray-500">
                      Toxun və ya bura sürüşdür
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      JPG · PNG · maksimum 10 MB
                    </p>
                  </div>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFile}
            />
          </label>
        </div>

        {/* Növbələşən CTA kartları — qalan sahəni doldurur */}
        <div className="flex min-h-0 flex-1 items-center px-4 py-3">
          {/* Çox alçaq ekranlarda (məs. 568px) kart üçün yer qalmır —
              məzmunun kəsilməməsi üçün gizlədilir, funksional hissələr qalır. */}
          <div className="relative hidden h-full max-h-[210px] min-h-[132px] w-full [@media(min-height:640px)]:block">
            {UPLOAD_MESSAGES.map((m, i) => (
              <div
                key={m.title}
                className="sc-rotate-msg absolute inset-0"
                style={{ animationDelay: `${i * 5}s` }}
              >
                <div
                  className={`relative flex h-full flex-col justify-center overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg ${m.card}`}
                >
                  {/* dekorativ işıq */}
                  <div
                    aria-hidden
                    className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl ${m.glow}`}
                  />

                  {m.variant === "gift" ? (
                    // Hədiyyə: ikon solda qutuda, mətn sağda
                    <div className="relative flex items-center gap-4">
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl backdrop-blur">
                        {m.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold">{m.title}</p>
                        <p className="mt-1 text-xs leading-snug text-white/85">
                          {m.text}
                        </p>
                      </div>
                    </div>
                  ) : m.variant === "delivery" ? (
                    // Çatdırılma: marşrut xətti
                    <div className="relative text-center">
                      <div className="mb-2.5 flex items-center justify-center gap-2">
                        <span className="text-2xl">{m.icon}</span>
                        <span className="h-px w-12 border-t-2 border-dashed border-white/60" />
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 text-sm backdrop-blur">
                          📍
                        </span>
                      </div>
                      <p className="text-sm font-bold">{m.title}</p>
                      <p className="mt-1 text-xs leading-snug text-white/85">
                        {m.text}
                      </p>
                    </div>
                  ) : (
                    // Dizayn: palitra nöqtələri
                    <div className="relative text-center">
                      <span className="text-3xl">{m.icon}</span>
                      <p className="mt-2 text-sm font-bold">{m.title}</p>
                      <p className="mt-1 text-xs leading-snug text-white/85">
                        {m.text}
                      </p>
                      <div className="mt-3 flex justify-center gap-1.5">
                        {["bg-white", "bg-amber-300", "bg-emerald-300", "bg-sky-300"].map(
                          (c) => (
                            <span
                              key={c}
                              className={`h-2 w-2 rounded-full ${c}`}
                            />
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Naviqasiya */}
        <div className="shrink-0 border-t border-gray-100 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {error && (
            <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
          <button
            disabled={!canNext()}
            onClick={() => setStep(1)}
            className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-40 disabled:shadow-none"
          >
            {!modelId
              ? "Telefon modelini seç"
              : !photoSrc
                ? "Şəkil yüklə"
                : "Dizayna keç →"}
          </button>
        </div>
      </div>
    );
  }

  // --- Dizayn addımı: tam ekran, scroll-suz ---
  // Önizləmə həmişə üstdə görünür, nəzarətlər altdakı sabit ölçülü kartda
  // tablar arasında dəyişir — beləliklə heç bir dəyişiklik ekrandan çıxmır.
  if (step === 1 && shape) {
    return (
      <div className="flex h-[100dvh] flex-col bg-white">
        {/* Önizləmə */}
        <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-2 pt-4">
          <CaseCanvas
            ref={canvasRef}
            shape={shape}
            photoSrc={photoSrc}
            transform={transform}
            text={text}
            fit="height"
          />
        </div>

        {/* Nəzarət kartı — sabit */}
        <div className="shrink-0 rounded-t-2xl border-t border-gray-200 bg-white px-4 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {error && (
            <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Tablar */}
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1">
            {DESIGN_TABS.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setDesignTab(i)}
                className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
                  designTab === i
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                <span className="mr-1">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab məzmunu — hündürlük sabitdir ki, layout tərpənməsin */}
          <div className="mt-3 h-[212px] overflow-y-auto sm:h-[226px]">
            {designTab === 0 && (
              <div>
                <div className="grid grid-cols-3 gap-2">
                  {AI_STYLES.map((s) => (
                    <button
                      key={s.id}
                      disabled={!s.available}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-[11px] font-medium transition-colors ${
                        s.available
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 text-gray-400"
                      }`}
                    >
                      <span className="text-xl">{s.emoji}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-center text-[11px] text-gray-500">
                  AI tərzlər tezliklə — hazırda orijinal şəkil istifadə olunur.
                </p>
              </div>
            )}

            {designTab === 1 && (
              <div className="space-y-3 pt-1">
                <RangeRow
                  label="Yaxınlaşdır"
                  min={0.5}
                  max={2.5}
                  step={0.01}
                  value={transform.scale}
                  onChange={(v) => setTransform((t) => ({ ...t, scale: v }))}
                />
                <RangeRow
                  label="Üfüqi"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={transform.offsetX}
                  onChange={(v) => setTransform((t) => ({ ...t, offsetX: v }))}
                />
                <RangeRow
                  label="Şaquli"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={transform.offsetY}
                  onChange={(v) => setTransform((t) => ({ ...t, offsetY: v }))}
                />
                <button
                  onClick={() =>
                    setTransform({ scale: 1, offsetX: 0, offsetY: 0 })
                  }
                  className="w-full rounded-lg border border-gray-300 py-2 text-xs font-medium text-gray-600 active:bg-gray-50"
                >
                  Sıfırla
                </button>
              </div>
            )}

            {designTab === 2 && (
              <div className="space-y-2.5 pt-1">
                <textarea
                  value={text.text}
                  onChange={(e) =>
                    setText((t) => ({ ...t, text: e.target.value }))
                  }
                  placeholder="Məsələn: adın, tarix, şüar…"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <div className="flex items-center gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setText((t) => ({ ...t, color: c }))}
                      className={`h-7 w-7 shrink-0 rounded-full border-2 ${
                        text.color === c
                          ? "border-indigo-500"
                          : "border-gray-200"
                      }`}
                      style={{ background: c }}
                      aria-label={c}
                    />
                  ))}
                  <select
                    value={text.font}
                    onChange={(e) =>
                      setText((t) => ({ ...t, font: e.target.value }))
                    }
                    className="ml-auto min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                  >
                    {FONTS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <RangeRow
                  label="Ölçü"
                  min={20}
                  max={80}
                  step={1}
                  value={text.size}
                  onChange={(v) => setText((t) => ({ ...t, size: v }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <RangeRow
                    label="↔"
                    min={0.1}
                    max={0.9}
                    step={0.01}
                    value={text.x}
                    onChange={(v) => setText((t) => ({ ...t, x: v }))}
                    compact
                  />
                  <RangeRow
                    label="↕"
                    min={0.1}
                    max={0.95}
                    step={0.01}
                    value={text.y}
                    onChange={(v) => setText((t) => ({ ...t, y: v }))}
                    compact
                  />
                </div>

                {/* Fon və çərçivə */}
                <div className="flex items-center gap-2">
                  <div className="flex shrink-0 rounded-lg bg-gray-100 p-0.5">
                    {TEXT_BACKGROUNDS.map((b) => (
                      <button
                        key={b.value}
                        onClick={() =>
                          setText((t) => ({ ...t, bg: b.value }))
                        }
                        className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                          text.bg === b.value
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-gray-500"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>

                  {/* Fon rəngi — yalnız fon aktivdirsə */}
                  {text.bg !== "none" && (
                    <div className="flex items-center gap-1.5">
                      {BG_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() =>
                            setText((t) => ({ ...t, bgColor: c }))
                          }
                          className={`h-6 w-6 shrink-0 rounded-full border-2 ${
                            text.bgColor === c
                              ? "border-indigo-500"
                              : "border-gray-200"
                          }`}
                          style={{ background: c }}
                          aria-label={`Fon rəngi ${c}`}
                        />
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() =>
                      setText((t) => ({ ...t, border: !t.border }))
                    }
                    className={`ml-auto shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      text.border
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 text-gray-500"
                    }`}
                  >
                    Çərçivə
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Naviqasiya */}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => setStep(0)}
              className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 active:bg-gray-50"
            >
              Geri
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex-1 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white"
            >
              Növbəti
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {/* Başlıq */}
      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-wider text-indigo-500">
          {store.name}
        </p>
        <h1 className="text-xl font-bold text-gray-900">Özəl kabronu yarat</h1>
      </div>

      {/* Addım göstəricisi */}
      <div className="mb-2 flex items-center justify-between gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className={`h-1.5 rounded-full ${
                i <= step ? "bg-indigo-500" : "bg-gray-200"
              }`}
            />
            <p
              className={`mt-1 hidden text-[10px] sm:block ${
                i === step ? "font-semibold text-indigo-600" : "text-gray-400"
              }`}
            >
              {s}
            </p>
          </div>
        ))}
      </div>
      <p className="mb-6 text-center text-xs font-semibold text-indigo-600 sm:hidden">
        {STEPS[step]}
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* STEP 2 — Aksesuarlar (cross-sell) */}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Kabronla birlikdə əlavə etmək istərsən?
          </p>
          {addons.map((a) => {
            const qty = addonQty[a.id] ?? 0;
            return (
              <div
                key={a.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  qty > 0 ? "border-indigo-300 bg-indigo-50" : "border-gray-200"
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{a.name}</p>
                  {a.description && (
                    <p className="text-xs text-gray-500">{a.description}</p>
                  )}
                  <p className="mt-1 text-sm font-semibold text-indigo-600">
                    {formatPrice(a.price)}
                  </p>
                </div>
                <QtyStepper
                  value={qty}
                  onChange={(v) =>
                    setAddonQty((m) => ({ ...m, [a.id]: v }))
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      {/* STEP 3 — Çatdırılma & əlaqə */}
      {step === 3 && (
        <div className="space-y-4">
          <Field
            label="Ad, Soyad"
            value={customer.name}
            onChange={(v) => setCustomer((c) => ({ ...c, name: v }))}
          />
          <Field
            label="Telefon"
            value={customer.phone}
            onChange={(v) => setCustomer((c) => ({ ...c, phone: v }))}
            placeholder="+994 __ ___ __ __"
          />
          <Field
            label="Email (istəyə bağlı)"
            value={customer.email}
            onChange={(v) => setCustomer((c) => ({ ...c, email: v }))}
          />
          <Field
            label="Ünvan (istəyə bağlı)"
            value={customer.address}
            onChange={(v) => setCustomer((c) => ({ ...c, address: v }))}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Şəhər
            </label>
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPickupId("");
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Pickup məntəqəsi
            </label>
            {suggestedPoint && !pickupId && (
              <p className="mb-2 text-xs text-indigo-600">
                Təklif olunan: {suggestedPoint.name}
              </p>
            )}
            <div className="space-y-2">
              {pointsForCity.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPickupId(p.id)}
                  className={`flex w-full items-start gap-2 rounded-lg border p-3 text-left ${
                    pickupId === p.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200"
                  }`}
                >
                  <span className="text-lg">📍</span>
                  <span>
                    <span className="block text-sm font-medium text-gray-900">
                      {p.name}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {p.address}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Ödəniş üsulu
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                className={`rounded-lg border p-3 text-sm ${
                  paymentMethod === "CASH_ON_DELIVERY"
                    ? "border-indigo-500 bg-indigo-50 font-medium"
                    : "border-gray-200"
                }`}
              >
                Çatdırılmada ödəniş
              </button>
              <button
                onClick={() => setPaymentMethod("CARD")}
                className={`rounded-lg border p-3 text-sm ${
                  paymentMethod === "CARD"
                    ? "border-indigo-500 bg-indigo-50 font-medium"
                    : "border-gray-200"
                }`}
              >
                Kartla ödəniş
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 — Təsdiq */}
      {step === 4 && (
        <div className="space-y-4">
          {shape && (
            <div className="flex justify-center">
              <div className="w-44">
                <CaseCanvas
                  ref={canvasRef}
                  shape={shape}
                  photoSrc={photoSrc}
                  transform={transform}
                  text={text}
                />
              </div>
            </div>
          )}
          <div className="rounded-xl border border-gray-200 p-4 text-sm">
            <Row label={selectedModel?.name ?? "Kabro"} value={formatPrice(caseProduct.price)} />
            {addons
              .filter((a) => (addonQty[a.id] ?? 0) > 0)
              .map((a) => (
                <Row
                  key={a.id}
                  label={`${a.name} × ${addonQty[a.id]}`}
                  value={formatPrice((addonQty[a.id] ?? 0) * a.price)}
                />
              ))}
            <Row label="Çatdırılma" value={formatPrice(SHIPPING_FEE)} />
            <div className="my-2 border-t border-gray-200" />
            <Row label="Cəmi" value={formatPrice(total)} bold />
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            <p>
              <span className="font-medium text-gray-800">Müştəri:</span>{" "}
              {customer.name} · {customer.phone}
            </p>
            <p>
              <span className="font-medium text-gray-800">Pickup:</span>{" "}
              {pointsForCity.find((p) => p.id === pickupId)?.name ?? "—"}
            </p>
            <p>
              <span className="font-medium text-gray-800">Ödəniş:</span>{" "}
              {paymentMethod === "CARD"
                ? "Kartla ödəniş"
                : "Çatdırılmada ödəniş"}
            </p>
          </div>
        </div>
      )}

      {/* Naviqasiya (sabit alt panel) */}
      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white/95 px-4 pt-3 backdrop-blur pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 active:bg-gray-50"
            >
              Geri
            </button>
          )}
          <div className="flex-1 text-right text-sm text-gray-500">
            {step >= 2 && <span>Cəmi: {formatPrice(total)}</span>}
          </div>
          {step < STEPS.length - 1 ? (
            <button
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              Növbəti
            </button>
          ) : (
            <button
              disabled={submitting}
              onClick={submitOrder}
              className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Göndərilir…" : "Sifarişi tamamla"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Kiçik köməkçi komponentlər ---

function RangeRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
  compact = false,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`shrink-0 text-xs text-gray-500 ${
          compact ? "w-4 text-center text-sm" : "w-24"
        }`}
      >
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-indigo-600"
      />
    </div>
  );
}

function QtyStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-lg leading-none text-gray-700 active:bg-gray-300"
      >
        −
      </button>
      <span className="w-5 text-center text-sm font-medium">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg leading-none text-white active:bg-indigo-700"
      >
        +
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
      />
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between py-1 ${
        bold ? "text-base font-bold text-gray-900" : "text-gray-600"
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
