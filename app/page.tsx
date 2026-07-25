import Link from "next/link";

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

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <span className="text-lg font-bold text-gray-900">
            Sublim<span className="text-indigo-600">Cases</span>
          </span>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 active:bg-gray-50"
          >
            Panelə giriş
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 pb-14 pt-12 sm:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-500">
              Özəl sifariş telefon kabroları
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-gray-900 sm:text-5xl">
              Öz şəklinlə{" "}
              <span className="text-indigo-600">unikal kabro</span> yarat
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Mağazadakı QR kodu skan et, şəklini yüklə və dizaynını real vaxtda
              gör. Bir neçə dəqiqəyə sifariş et — biz istehsal edib ən yaxın
              pickup məntəqəsinə çatdıraq.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#nece-isleyir"
                className="rounded-lg bg-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white active:bg-indigo-700"
              >
                Necə işləyir?
              </a>
              <a
                href="#magazalar"
                className="rounded-lg border border-gray-300 px-6 py-3 text-center text-sm font-semibold text-gray-700 active:bg-gray-50"
              >
                Mağazalar üçün
              </a>
            </div>
          </div>

          {/* Kabro vizualı */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-8 rounded-full bg-indigo-100/60 blur-3xl" />
              <div className="relative h-[380px] w-[195px] rounded-[2.2rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-2 shadow-2xl">
                <div className="flex h-full w-full items-center justify-center rounded-[1.8rem] bg-white/10 backdrop-blur">
                  <span className="text-5xl">✨</span>
                </div>
                <div className="absolute right-4 top-4 h-16 w-16 rounded-2xl bg-black/30 backdrop-blur">
                  <div className="grid h-full grid-cols-2 place-items-center p-2">
                    <span className="h-4 w-4 rounded-full bg-gray-900/80 ring-1 ring-white/30" />
                    <span className="h-4 w-4 rounded-full bg-gray-900/80 ring-1 ring-white/30" />
                    <span className="h-4 w-4 rounded-full bg-gray-900/80 ring-1 ring-white/30" />
                    <span className="h-2 w-2 rounded-full bg-yellow-200/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Necə işləyir */}
      <section id="nece-isleyir" className="bg-gray-50 py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Necə işləyir?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-600">
            Dörd addım — hamısı telefonundan, mağazadan çıxmadan.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="rounded-2xl border border-gray-200 bg-white p-5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-xs font-bold text-indigo-500">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1.5 text-sm text-gray-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mağazalar üçün */}
      <section id="magazalar" className="py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="rounded-3xl bg-gray-900 p-8 sm:p-12">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
                  Partnyor mağazalar üçün
                </p>
                <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                  Vitrinində yer ver, hər sifarişdən qazan
                </h2>
                <p className="mt-4 text-gray-300">
                  Sənə pulsuz vitrin və QR kod veririk. Müştəri skan edib
                  sifariş verir — istehsalı və çatdırılmanı biz görürük, sən
                  isə hər sifarişdən komissiya qazanırsan. Anbar, risk, əlavə
                  iş yoxdur.
                </p>
                <Link
                  href="/login"
                  className="mt-6 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-gray-900 active:bg-gray-100"
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
                    className="rounded-2xl bg-white/10 p-4 text-center"
                  >
                    <p className="text-xl font-bold text-white">{b.v}</p>
                    <p className="mt-1 text-[11px] text-gray-400">{b.l}</p>
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
