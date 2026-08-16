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
| **STORE_ADMIN** (mağaza) | Yalnız öz mağazasının sifarişləri, komissiya balansı, ödəniş tarixçəsi və QR kodu |

## Əsas axın

| Yol | Təyinat | Giriş |
|-----|---------|-------|
| `/` | Landing page | açıq |
| `/q/<code>` | **Stendin ÖN QR-ı** — müştəri skan edir, sifariş həmin mağazaya yazılır | açıq |
| `/m/<staffCode>` | **Stendin ARXA QR-ı** — satıcı skan edir, şifrə ilə hesabata girir | açıq |
| `/s/<slug>` | Birbaşa mağaza linki (daxili test / köhnə linklər) | açıq |
| `/login` | Vahid giriş — rola görə yönləndirir | açıq |
| `/admin` | Platforma icmalı (dövriyyə, komissiya, xalis gəlir) | platforma |
| `/admin/orders` · `/admin/orders/<id>` | Bütün sifarişlər + status idarəetməsi | platforma |
| `/admin/stores` · `/admin/stores/new` | Mağaza siyahısı və qeydiyyatı | platforma |
| `/admin/stores/<id>` | Mağaza detalı: statistika, QR, admin təyini | platforma |
| `/admin/qr` | QR stendlər: partiya yaratma, mağazaya təyinat, PNG | platforma |
| `/admin/qr/print` | Toplu çap vərəqi (brauzerdən çap) | platforma |
| `/admin/payouts` | Mağaza komissiya balansları və nağd ödəniş qeydi | platforma |
| `/store` | Mağazanın öz sifarişləri və qazancı | mağaza |
| `/store/payouts` | Öz komissiya balansı, hədd göstəricisi, alınmış ödənişlər | mağaza |
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
- `POST /api/auth/stand-login` — stendin arxa kodu + şifrə ilə giriş
  (kod mağazanı müəyyən edir; sürət məhdudiyyəti tətbiq olunur).
- `POST /api/admin/stores` — mağaza qeydiyyatı (+ istəyə bağlı admin hesabı).
- `POST /api/admin/stores/<id>/users` — mövcud mağazaya admin təyin edir.
- `GET /api/qr/<slug>` — mağaza linki üçün 1024px QR PNG (rola görə məhdudlaşır).
- `POST /api/admin/qr` — yeni QR kod partiyası yaradır (mağazasız).
- `PATCH /api/admin/qr/<id>` — kodu mağazaya təyin edir / geri alır / deaktiv edir.
- `DELETE /api/admin/qr/<id>` — tək kodu silir (sifarişi varsa 409 qaytarır).
- `DELETE /api/admin/qr/batch` — partiyanı silir; sifarişi olan kodlar saxlanılır.
- `GET /api/admin/qr/<id>/png?side=front|back` — ön (müştəri) və ya arxa
  (satıcı) QR-ın 1024px PNG-si.
- `POST /api/admin/payouts` — mağazaya ödənişi qeydə alır. Məbləğ **serverdə**
  ödənilməmiş sifarişlərdən hesablanır (admin əl ilə yazmır) və hər şey bir
  transaksiyada bağlanır.

## Verilənlər modeli

`Store` (komissiya nisbəti), `QrCode` (stend kodu, partiya, mağazaya təyinat),
`User` (rol + mağaza bağlantısı), `Session`,
`PhoneModel` (kabro forması JSON), `Product` (`CASE` / `ADDON`),
`PickupPoint`, `Order` (+ mağaza attribution, qiymət snapshot-ları, komissiya),
`OrderAddon`, `Payout` (mağazaya edilən komissiya hesablaşması).

Parollar `scrypt` ilə hash-lənir (salt + timing-safe müqayisə), sessiyalar bazada saxlanılır.

### QR stendlər

Fiziki stendlər mağaza tapılmadan **əvvəl** çap olunur. Axın belədir:

Hər stenddə **iki** QR olur:

| Yer | Kod | Kim skan edir | Nə açılır |
|-----|-----|---------------|-----------|
| Ön | `code` | Müştəri | Sifariş sihirbazı |
| Arxa | `staffCode` | Satıcı | Şifrə → satış hesabatı və komissiya |

1. `/admin/qr` → partiya yaradılır (məs. 50 stend, `2026-07-A`) — hər stend
   üçün iki kod avtomatik yaranır
2. `/admin/qr/print` → vərəq çap olunur; hər stendin ön/arxa kodu etiketlə
   yan-yana verilir
3. Mağaza ilə razılaşdıqda stend həmin mağazaya təyin edilir — hər iki kod
   eyni anda işə düşür
4. Müştəri ön kodu skan edir → sifariş mağazaya yazılır
5. Satıcı arxa kodu skan edir → şifrə → öz hesabatı

Arxa kod ön koddan ayrıdır: müştəri stendin üzündəki kodu görsə belə
hesabat linkini təxmin edə bilmir. Girişdə yalnız şifrə istənilir (kod
mağazanı özü müəyyən edir), ona görə uğursuz cəhdlər məhdudlaşdırılır.

Sifarişdə həm `storeId` (komissiya üçün snapshot), həm də `qrCodeId` saxlanılır —
stend sonradan başqa mağazaya keçsə də köhnə sifarişlərin attribution-ı pozulmur.
Təyin olunmamış kod skan edilsə sifariş qəbul edilmir; müştəriyə kod göstərilir.

## Mağaza ödənişləri (komissiya hesablaşması)

Müştəri ödənişi bizə onlayn gəlir; mağazanın komissiyası isə **nağd, əldən**
verilir. Sistem bu hesablaşmanı izləyir:

1. Hər ləğv edilməmiş sifariş mağaza üçün komissiya borcu yaradır
   (`Order.commissionAmount`, sifariş anındakı nisbətlə snapshot).
2. Borc yığılır. `/admin/payouts`-da hər mağazanın cari balansı görünür;
   **50 ₼** həddini keçən mağazalar «Ödənişə hazır» kimi yuxarıda işarələnir.
3. Pul veriləndə admin «Ödənişi qeyd et» edir. Həmin anda mağazanın
   ödənilməmiş **bütün** sifarişləri bir `Payout` qeydinə bağlanır və balans
   sıfırlanır.
4. Ondan sonrakı sifarişlər yenidən sıfırdan yığılmağa başlayır.

Vacib detallar:

- **Məbləği admin yazmır** — sistem bağlanan sifarişlərdən hesablayır, ona görə
  hesabat həmişə sifarişlərlə uzlaşır.
- Ödəniş `prisma.$transaction` daxilində yazılır və bağlanacaq sifarişlər də
  transaksiya içində oxunur — eyni komissiya iki dəfə ödənilə bilmir.
- Hər `Payout` hansı sifarişləri örtdüyünü saxlayır, üstəlik üsul
  (`CASH` / `BANK`), qeyd və ödənişi qeyd edən admin yazılır.
- Ləğv edilmiş sifariş komissiya yaratmır.
- Mağaza `/store/payouts`-da öz balansını, həddə nə qədər qaldığını və
  aldığı ödənişlərin tarixçəsini görür — beləliklə hesablaşma iki tərəf üçün
  də şəffafdır.

> Qeyd: hazırda komissiya **ləğv edilməmiş bütün** sifarişlərdən yığılır
> (`paymentStatus` yox, `status` əsas götürülür). Stripe webhook qoşulandan
> sonra bunu «yalnız ödənişi təsdiqlənmiş sifarişlər» qaydasına keçirmək olar —
> dəyişiklik tək yerdə, `lib/payouts.ts` → `payableWhere` içindədir.

## Supabase proyektini köçürmək (başqa hesaba / yeni proyektə)

Free planda hesab başına 2 aktiv proyekt olur. Proyekt dayandırılıbsa
(*paused*) və ya başqa hesaba keçmək lazımdırsa, köçürmə iki hissədən
ibarətdir — **baza** və **şəkillər**. İkisi ayrı yerdə saxlanılır, ona görə
təkcə bazanı köçürmək kifayət etmir: `Order.uploadedImage` / `designImage`
sahələri yalnız obyekt açarını (`design/uuid.jpg`) saxlayır, faylın özünü yox.

### 0. Köhnə proyekti oxunan hala gətir

Dayandırılmış proyektdən oxumaq olmur. Dashboard-da:

- **Restore** — proyekti geri qaldırır. Free planda 2 aktiv limit var, ona
  görə əvvəlcə digər proyektlərdən birini dayandırmaq lazım gələ bilər.
- Alternativ: paused proyektin səhifəsindəki **Download backup** ilə ehtiyat
  nüsxəni endirmək.

### 1. Yeni proyekti hazırla

Yeni hesabda proyekt aç, sonra sxemi qur:

```bash
DATABASE_URL="<yeni-pooler-6543>" \
DIRECT_URL="<yeni-direct-5432>" \
npx prisma migrate deploy
```

Bu, bütün cədvəlləri sıfırdan yaradır — sxemi əl ilə köçürmək lazım deyil.

### 2. Bazanı köçür

```bash
SOURCE_DATABASE_URL="<köhnə-bağlantı>" \
TARGET_DATABASE_URL="<yeni-bağlantı>" \
npm run db:copy
```

`pg_dump` tələb etmir — Prisma ilə oxuyub yazır, cədvəl sırası foreign key
asılılıqlarına görə düzülüb. **İdempotentdir**: mövcud sətirlər (eyni `id`)
atlanır, ona görə yarımçıq qalsa təkrar işlətmək təhlükəsizdir.

### 3. Şəkilləri köçür

```bash
SOURCE_SUPABASE_URL="https://<köhnə>.supabase.co" \
SOURCE_SUPABASE_SECRET_KEY="sb_secret_..." \
TARGET_SUPABASE_URL="https://<yeni>.supabase.co" \
TARGET_SUPABASE_SECRET_KEY="sb_secret_..." \
npm run storage:copy
```

Hədəfdə `order-images` bucket-i yoxdursa private olaraq yaradılır. Bu da
idempotentdir — mövcud fayl yenidən yüklənmir.

### 4. Railway dəyişənlərini yenilə

`DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY` —
dördü də yeni proyektin dəyərləri ilə əvəzlənir, sonra redeploy.

> Açarları və bağlantı sətirlərini yalnız Railway Variables-a yazın; kodda,
> commit-də və ya çatda saxlamayın.

### 5. Yoxla

Panelə gir → sifariş siyahısında şəkillər görünürsə həm baza, həm storage
düzgün köçüb.

**Alternativ:** köhnə bazada yalnız test məlumatı varsa köçürməyə ehtiyac
yoxdur — yeni proyektin dəyişənlərini Railway-ə yazmaq kifayətdir. `npm start`
konteyner qalxarkən `prisma migrate deploy` + seed işlədir, sxem və nümunə
məlumat avtomatik qurulur.

## Növbəti mərhələlər (roadmap)

- Canvas mockup → **generativ AI** render (fotorealistik).
- Kargo şirkəti API inteqrasiyası (ünvana görə real ən yaxın pickup məntəqəsi).
- Şəkillərə ölçü optimallaşdırması (yükləmədən əvvəl kiçiltmə/sıxma).
- Stripe webhook — `paymentStatus` avtomatik `PAID` olsun.
