import Link from "next/link";
import CaseArt from "@/components/landing/CaseArt";

export const dynamic = "force-static";

const STEPS = [
  {
    icon: "📱",
    title: "QR kodu skan et",
    text: "Mağaza vitrinindəki kodu telefonunla oxut — heç bir tətbiq yükləmək lazım deyil.",
  },
  {
    icon: "🖼️",
    title: "Şəklini yüklə",
    text: "Telefon modelini seç, şəklini yüklə və kabronun üzərində necə görünəcəyini dərhal gör.",
  },
  {
    icon: "✍️",
    title: "Mətn əlavə et",
    text: "Ad, tarix və ya şüar yaz — rəngini, ölçüsünü və yerini özün seç.",
  },
  {
    icon: "🚚",
    title: "Sifariş ver",
    text: "Aksesuarları seç, ən yaxın pickup məntəqəsini göstər və sifarişi tamamla.",
  },
];

// Showcase lentindəki nümunə dizaynlar
const SHOWCASE = [
  { gradient: "bg-gradient-to-br from-indigo-500 to-purple-600", emoji: "🌊" },
  { gradient: "bg-gradient-to-br from-rose-400 to-orange-400", emoji: "🌅" },
  { gradient: "bg-gradient-to-br from-emerald-400 to-teal-600", emoji: "🌿" },
  { gradient: "bg-gradient-to-br from-fuchsia-500 to-pink-600", emoji: "💜" },
  { gradient: "bg-gradient-to-br from-sky-400 to-blue-600", emoji: "🐬" },
  { gradient: "bg-gradient-to-br from-amber-400 to-red-500", emoji: "🔥" },
  { gradient: "bg-gradient-to-br from-violet-500 to-indigo-700", emoji: "✨" },
  { gradient: "bg-gradient-to-br from-lime-400 to-emerald-600", emoji: "🍀" },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <span className="text-lg font-bold tracking-tight text-gray-900">
            Sublim<span className="text-indigo-600">Cases</span>
          </span>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-indigo-400 hover:text-indigo-600"
          >
            Panelə giriş
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden px-5 pb-20 pt-14 sm:pt-20">
        {/* Fon ləkələri */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="sc-blob absolute -left-24 top-0 h-80 w-80 rounded-full bg-indigo-300/35 blur-3xl" />
          <div
            className="sc-blob absolute -right-16 top-24 h-96 w-96 rounded-full bg-fuchsia-300/30 blur-3xl"
            style={{ animationDelay: "-6s" }}
          />
          <div
            className="sc-blob absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-300/30 blur-3xl"
            style={{ animationDelay: "-12s" }}
          />
        </div>

        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
          <div>
            <span
              className="sc-fade-up inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-700"
              style={{ animationDelay: "0.05s" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
              </span>
              Mağazada 2 dəqiqəyə hazır
            </span>

            <h1
              className="sc-fade-up mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl"
              style={{ animationDelay: "0.15s" }}
            >
              Öz şəklinlə{" "}
              <span className="sc-gradient-text">unikal kabro</span> yarat
            </h1>

            <p
              className="sc-fade-up mt-5 text-lg leading-relaxed text-gray-600"
              style={{ animationDelay: "0.25s" }}
            >
              Mağazadakı QR kodu skan et, şəklini yüklə və dizaynını real vaxtda
              gör. Bir neçə dəqiqəyə sifariş et — biz istehsal edib ən yaxın
              pickup məntəqəsinə çatdıraq.
            </p>

            <div
              className="sc-fade-up mt-8 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "0.35s" }}
            >
              <a
                href="#nece-isleyir"
                className="rounded-xl bg-indigo-600 px-7 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Necə işləyir?
              </a>
              <a
                href="#magazalar"
                className="rounded-xl border border-gray-300 px-7 py-3.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
              >
                Mağazalar üçün
              </a>
            </div>

            <div
              className="sc-fade-up mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-gray-500"
              style={{ animationDelay: "0.45s" }}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-500">✓</span> Tətbiq lazım deyil
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-500">✓</span> Canlı önizləmə
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-500">✓</span> Pickup çatdırılma
              </span>
            </div>
          </div>

          {/* Kabro klasteri */}
          <div className="relative flex h-[400px] items-center justify-center sm:h-[480px]">
            {/* Sol kabro */}
            <div className="absolute -translate-x-24 sm:-translate-x-28">
              <CaseArt
                gradient="bg-gradient-to-br from-sky-400 to-blue-600"
                emoji="🐬"
                className="h-52 w-28 opacity-90 sm:h-56 sm:w-32"
                rotate={-14}
                delay={-2}
              />
            </div>
            {/* Sağ kabro */}
            <div className="absolute translate-x-24 sm:translate-x-28">
              <CaseArt
                gradient="bg-gradient-to-br from-rose-400 to-orange-400"
                emoji="🌅"
                className="h-52 w-28 opacity-90 sm:h-56 sm:w-32"
                rotate={14}
                delay={-4}
              />
            </div>
            {/* Mərkəzdəki əsas kabro */}
            <CaseArt
              gradient="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
              emoji="✨"
              label="Sənin dizaynın"
              className="relative z-10 h-72 w-40 sm:h-80 sm:w-44"
            />
          </div>
        </div>
      </section>

      {/* Showcase lenti */}
      <section className="border-y border-gray-100 bg-gray-50/70 py-10">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
          Hər şəkil unikal kabroya çevrilir
        </p>
        <div className="relative overflow-hidden">
          {/* kənar sönmələr */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-gray-50 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-gray-50 to-transparent" />
          <div className="sc-marquee flex w-max gap-5">
            {[...SHOWCASE, ...SHOWCASE].map((s, i) => (
              <CaseArt
                key={i}
                gradient={s.gradient}
                emoji={s.emoji}
                className="h-40 w-24 shrink-0"
                float={false}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Necə işləyir */}
      <section id="nece-isleyir" className="scroll-mt-16 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Necə işləyir?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-600">
            Dörd addım — hamısı telefonundan, mağazadan çıxmadan.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="group relative rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5"
              >
                <span className="absolute right-5 top-5 text-3xl font-bold text-gray-100 transition-colors group-hover:text-indigo-100">
                  {i + 1}
                </span>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl transition-transform duration-300 group-hover:scale-110">
                  {s.icon}
                </span>
                <h3 className="mt-4 font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mağazalar üçün */}
      <section id="magazalar" className="scroll-mt-16 pb-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="relative overflow-hidden rounded-3xl bg-gray-900 p-8 sm:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40"
            >
              <div className="sc-blob absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/40 blur-3xl" />
              <div
                className="sc-blob absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-fuchsia-500/30 blur-3xl"
                style={{ animationDelay: "-8s" }}
              />
            </div>

            <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
                  Partnyor mağazalar üçün
                </p>
                <h2 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-4xl">
                  Vitrinində yer ver,
                  <br className="hidden sm:block" /> hər sifarişdən qazan
                </h2>
                <p className="mt-4 leading-relaxed text-gray-300">
                  Sənə pulsuz vitrin və QR kod veririk. Müştəri skan edib
                  sifariş verir — istehsalı və çatdırılmanı biz görürük, sən
                  isə hər sifarişdən komissiya qazanırsan. Anbar, risk, əlavə
                  iş yoxdur.
                </p>
                <Link
                  href="/login"
                  className="mt-7 inline-block rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-gray-900 transition-transform hover:-translate-y-0.5"
                >
                  Mağaza panelinə giriş
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: "0 ₼", l: "Başlanğıc xərci" },
                  { v: "%15", l: "Orta komissiya" },
                  { v: "24/7", l: "Sifariş axını" },
                ].map((b) => (
                  <div
                    key={b.l}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur transition-colors hover:bg-white/10"
                  >
                    <p className="text-xl font-bold text-white sm:text-2xl">
                      {b.v}
                    </p>
                    <p className="mt-1 text-[11px] leading-tight text-gray-400">
                      {b.l}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-5 text-sm text-gray-500 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Sublim Cases</span>
          <Link href="/login" className="hover:text-indigo-600">
            Panelə giriş
          </Link>
        </div>
      </footer>
    </div>
  );
}
