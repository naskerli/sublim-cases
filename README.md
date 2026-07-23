# Sublim Cases

Özəl sifariş telefon kabroları üçün platforma. Aksesuar mağazalarının vitrinlərinə
QR kod yerləşdirilir; müştəri QR-ı oxudub veb səhifəyə keçir, şəklini yükləyir,
telefon modelini seçir, kabronun üzərində necə göründüyünü canlı görür, mətn əlavə
edir, cross-sell aksesuarları seçir və sifariş verir. Hər sifariş öz mağazasına
bağlanır ki, mağaza komissiyası hesablansın.

## Texnologiya

- **Next.js 16** (App Router) + **TypeScript** — vahid kodbazada frontend + API
- **Prisma 7** + **SQLite** (better-sqlite3 driver adapter) — dev bazası
- **Tailwind CSS 4** — mobil-öncəlikli UI
- **Canvas** — kabro mockup preview (şəkil + mətn kompoziti), asset faylı tələb etmir
- **Stripe** (istəyə bağlı) — kart ödənişi; açar yoxdursa "çatdırılmada ödəniş"

## Quraşdırma

```bash
npm install
cp .env.example .env          # DATABASE_URL, ADMIN_PASSWORD, (Stripe)
npx prisma migrate dev        # sxemi tətbiq et
npm run db:seed               # nümunə mağaza/model/məhsul/pickup
npm run dev
```

`http://localhost:3000` — ana səhifə (demo mağaza linkləri).

## Əsas axın

| Yol | Təyinat |
|-----|---------|
| `/` | Landing + demo mağaza vitrinləri |
| `/s/<slug>` | **Müştəri sihirbazı** — QR kodun hədəfi (model→dizayn→aksesuar→çatdırılma→təsdiq) |
| `/admin` | Sifarişlər siyahısı + dövriyyə/komissiya xülasəsi |
| `/admin/orders/<id>` | Sifariş detalı + status idarəetməsi |
| `/admin/stores` | Mağazalar + hər mağazanın komissiya hesabatı |

Admin panelə default şifrə: `admin123` (`.env`-də `ADMIN_PASSWORD` ilə dəyişin).

## API

- `POST /api/orders` — sifariş yaradır. Qiymətlər **serverdə** bazadan hesablanır
  (client-ə etibar edilmir), şəkillər diskə saxlanılır, komissiya çıxarılır.
  Kart seçilib Stripe konfiqurasiya olunubsa Checkout URL qaytarır.
- `POST/DELETE /api/admin/login` — admin sessiyası (cookie).
- `PATCH /api/admin/orders/<id>` — sifariş statusunu yeniləyir.

## Verilənlər modeli

`Store` (QR slug + komissiya nisbəti), `PhoneModel` (kabro forması JSON),
`Product` (`CASE` əsas kabro / `ADDON` cross-sell), `PickupPoint` (kargo məntəqələri),
`Order` (+ mağaza attribution, qiymət snapshot-ları, komissiya), `OrderAddon`.

## Növbəti mərhələlər (roadmap)

- Canvas mockup → **generativ AI** render (fotorealistik).
- Kargo şirkəti API inteqrasiyası (ünvana görə real ən yaxın pickup məntəqəsi).
- Şəkil yükləməsini obyekt-store-a (S3) keçirmək (hazırda lokal disk).
- Mağaza öz-özünə idarəetmə paneli + komissiya ödəniş axını.
- İstehsalda Postgres-ə keçid.
