# Sublim Cases

Özəl sifariş telefon kabroları üçün platforma. Aksesuar mağazalarının vitrinlərinə
QR kod yerləşdirilir; müştəri QR-ı oxudub veb səhifəyə keçir, şəklini yükləyir,
telefon modelini seçir, kabronun üzərində necə göründüyünü canlı görür, mətn əlavə
edir, cross-sell aksesuarları seçir və sifariş verir. Hər sifariş öz mağazasına
bağlanır ki, mağaza komissiyası hesablansın.

## Texnologiya

- **Next.js 16** (App Router) + **TypeScript** — vahid kodbazada frontend + API
- **Prisma 7** + **PostgreSQL / Supabase** (`@prisma/adapter-pg` driver adapter)
- **Tailwind CSS 4** — mobil-öncəlikli UI
- **Canvas** — kabro mockup preview (şəkil + mətn kompoziti), asset faylı tələb etmir
- **Stripe** (istəyə bağlı) — kart ödənişi; açar yoxdursa "çatdırılmada ödəniş"

## Quraşdırma

```bash
npm install
cp .env.example .env          # DATABASE_URL + DIRECT_URL (Supabase), admin, (Stripe)
npx prisma migrate dev        # sxemi tətbiq et
npm run db:seed               # nümunə mağaza/model/məhsul/pickup + istifadəçilər
npm run dev
```

`http://localhost:3000` — landing səhifə.

### Verilənlər bazası bağlantısı

Supabase iki bağlantı verir və **hər ikisi lazımdır**:

| Dəyişən | Port | Nə üçün |
|---------|------|---------|
| `DATABASE_URL` | 6543 (pooler) | Runtime sorğuları — `?pgbouncer=true` əlavə edin |
| `DIRECT_URL` | 5432 (direct) | Miqrasiyalar (DDL + advisory lock pooler-dən keçmir) |

`DIRECT_URL` təyin olunmasa miqrasiyalar `DATABASE_URL`-ə düşür.

### Şəkil saxlama (Supabase Storage)

Müştəri şəkilləri **private** bucket-də (`order-images`) saxlanılır — bazada
yalnız obyekt açarı qalır, panel göstərəndə 1 saatlıq imzalı URL yaradılır.
Bucket yoxdursa ilk yükləmədə avtomatik yaradılır.

`SUPABASE_URL` + `SUPABASE_SECRET_KEY` (Project Settings → API → *Secret keys*,
`sb_secret_...`) **istehsalda mütləqdir**. Köhnə `service_role` JWT-si üçün
`SUPABASE_SERVICE_ROLE_KEY` də qəbul olunur.
Təyin olunmasa şəkillər lokal diskə yazılır və `next start` altında görünmür:
Next.js `public/` qovluğunu build zamanı sabitləyir, runtime-da yazılan
faylları serve etmir. Lokal disk yalnız `next dev` üçün fallback-dır və bu
halda server loguna xəbərdarlıq yazılır.

### Deploy (Railway və s.)

`npm start` konteyner qalxarkən avtomatik `prisma migrate deploy` →
`seed` → `next start` işlədir. Seed idempotentdir: mövcud mağaza/istifadəçi
məlumatlarını pozmur, parolları sıfırlamır. Env dəyişənlərini platformada
təyin etmək kifayətdir.

## İstifadəçi rolları

| Rol | Görür |
|-----|-------|
| **Müştəri** (girişsiz) | Landing + QR-dan açılan sifariş sihirbazı |
| **PLATFORM_ADMIN** (biz) | Bütün mağazalar/sifarişlər, mağaza qeydiyyatı, admin təyini, QR generasiya |
| **STORE_ADMIN** (mağaza) | Yalnız öz mağazasının sifarişləri, qazancı və QR kodu |

## Əsas axın

| Yol | Təyinat | Giriş |
|-----|---------|-------|
| `/` | Landing page | açıq |
| `/q/<code>` | **Stend QR-ının hədəfi** — kod hansı mağazaya təyin olunubsa sifariş ora yazılır | açıq |
| `/s/<slug>` | Birbaşa mağaza linki (daxili test / köhnə linklər) | açıq |
| `/login` | Vahid giriş — rola görə yönləndirir | açıq |
| `/admin` | Platforma icmalı (dövriyyə, komissiya, xalis gəlir) | platforma |
| `/admin/orders` · `/admin/orders/<id>` | Bütün sifarişlər + status idarəetməsi | platforma |
| `/admin/stores` · `/admin/stores/new` | Mağaza siyahısı və qeydiyyatı | platforma |
| `/admin/stores/<id>` | Mağaza detalı: statistika, QR, admin təyini | platforma |
| `/admin/qr` | QR stendlər: partiya yaratma, mağazaya təyinat, PNG | platforma |
| `/admin/qr/print` | Toplu çap vərəqi (brauzerdən çap) | platforma |
| `/store` | Mağazanın öz sifarişləri və qazancı | mağaza |
| `/store/qr` | Mağazaya təyin olunmuş stendlər və kodları | mağaza |

### Demo hesablar (seed)

- Platforma: `admin@sublim.az` / `admin123` (`.env`-də `PLATFORM_ADMIN_EMAIL`/`PLATFORM_ADMIN_PASSWORD` ilə dəyişin)
- Mağaza: `mobistyle@sublim.az` / `magaza123` (digər demo mağazalar: `phoneup@`, `ganja@`)

## API

- `POST /api/orders` — sifariş yaradır. Qiymətlər **serverdə** bazadan hesablanır
  (client-ə etibar edilmir), şəkillər saxlanılır, komissiya çıxarılır.
  Kart seçilib Stripe konfiqurasiya olunubsa Checkout URL qaytarır.
- `PATCH /api/orders/<id>` — status yeniləyir (mağaza admini yalnız öz sifarişlərini).
- `POST/DELETE /api/auth/login` — sessiya yaradır/bitirir (httpOnly cookie).
- `POST /api/admin/stores` — mağaza qeydiyyatı (+ istəyə bağlı admin hesabı).
- `POST /api/admin/stores/<id>/users` — mövcud mağazaya admin təyin edir.
- `GET /api/qr/<slug>` — mağaza linki üçün 1024px QR PNG (rola görə məhdudlaşır).
- `POST /api/admin/qr` — yeni QR kod partiyası yaradır (mağazasız).
- `PATCH /api/admin/qr/<id>` — kodu mağazaya təyin edir / geri alır / deaktiv edir.
- `GET /api/admin/qr/<id>/png` — stend maketi üçün 1024px QR PNG.

## Verilənlər modeli

`Store` (komissiya nisbəti), `QrCode` (stend kodu, partiya, mağazaya təyinat),
`User` (rol + mağaza bağlantısı), `Session`,
`PhoneModel` (kabro forması JSON), `Product` (`CASE` / `ADDON`),
`PickupPoint`, `Order` (+ mağaza attribution, qiymət snapshot-ları, komissiya), `OrderAddon`.

Parollar `scrypt` ilə hash-lənir (salt + timing-safe müqayisə), sessiyalar bazada saxlanılır.

### QR stendlər

Fiziki stendlər mağaza tapılmadan **əvvəl** çap olunur. Axın belədir:

1. `/admin/qr` → partiya yaradılır (məs. 50 kod, `2026-07-A`)
2. `/admin/qr/print` → vərəq çap olunur, kodlar stendlərə yapışdırılır
3. Mağaza ilə razılaşdıqda kod həmin mağazaya təyin edilir
4. Müştəri skan edir → `/q/<code>` → sifariş həmin mağazaya yazılır

Sifarişdə həm `storeId` (komissiya üçün snapshot), həm də `qrCodeId` saxlanılır —
stend sonradan başqa mağazaya keçsə də köhnə sifarişlərin attribution-ı pozulmur.
Təyin olunmamış kod skan edilsə sifariş qəbul edilmir; müştəriyə kod göstərilir.

## Növbəti mərhələlər (roadmap)

- Canvas mockup → **generativ AI** render (fotorealistik).
- Kargo şirkəti API inteqrasiyası (ünvana görə real ən yaxın pickup məntəqəsi).
- Şəkillərə ölçü optimallaşdırması (yükləmədən əvvəl kiçiltmə/sıxma).
- Komissiya ödəniş axını (hesabat → ödəniş qeydi).
