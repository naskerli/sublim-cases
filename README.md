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

`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` **istehsalda mütləqdir**.
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
| `/s/<slug>` | **Müştəri sihirbazı** — QR hədəfi (model→dizayn→aksesuar→çatdırılma→təsdiq) | açıq |
| `/login` | Vahid giriş — rola görə yönləndirir | açıq |
| `/admin` | Platforma icmalı (dövriyyə, komissiya, xalis gəlir) | platforma |
| `/admin/orders` · `/admin/orders/<id>` | Bütün sifarişlər + status idarəetməsi | platforma |
| `/admin/stores` · `/admin/stores/new` | Mağaza siyahısı və qeydiyyatı | platforma |
| `/admin/stores/<id>` | Mağaza detalı: statistika, QR, admin təyini | platforma |
| `/store` | Mağazanın öz sifarişləri və qazancı | mağaza |
| `/store/qr` | Mağazanın öz QR kodu (çap üçün yükləmə) | mağaza |

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
- `GET /api/qr/<slug>` — çap üçün 1024px QR PNG (rola görə məhdudlaşır).

## Verilənlər modeli

`Store` (QR slug + komissiya nisbəti), `User` (rol + mağaza bağlantısı), `Session`,
`PhoneModel` (kabro forması JSON), `Product` (`CASE` / `ADDON`),
`PickupPoint`, `Order` (+ mağaza attribution, qiymət snapshot-ları, komissiya), `OrderAddon`.

Parollar `scrypt` ilə hash-lənir (salt + timing-safe müqayisə), sessiyalar bazada saxlanılır.

## Növbəti mərhələlər (roadmap)

- Canvas mockup → **generativ AI** render (fotorealistik).
- Kargo şirkəti API inteqrasiyası (ünvana görə real ən yaxın pickup məntəqəsi).
- Şəkillərə ölçü optimallaşdırması (yükləmədən əvvəl kiçiltmə/sıxma).
- Mağaza öz-özünə idarəetmə paneli + komissiya ödəniş axını.
- İstehsalda Postgres-ə keçid.
