# Servis Defteri

<p align="center">
  <a href="https://github.com/Nurettin-Erdogan/islik-cloud/actions/workflows/api-ci.yml"><img src="https://github.com/Nurettin-Erdogan/islik-cloud/actions/workflows/api-ci.yml/badge.svg?branch=main" alt="API CI"></a>
  <a href="https://github.com/Nurettin-Erdogan/islik-cloud/actions/workflows/web-ci.yml"><img src="https://github.com/Nurettin-Erdogan/islik-cloud/actions/workflows/web-ci.yml/badge.svg?branch=main" alt="Web CI"></a>
  <a href="https://github.com/Nurettin-Erdogan/islik-cloud/actions/workflows/mobile-ci.yml"><img src="https://github.com/Nurettin-Erdogan/islik-cloud/actions/workflows/mobile-ci.yml/badge.svg?branch=main" alt="Mobil CI"></a>
</p>

Servis Defteri; müşterilerin servis talebi oluşturup takip edebildiği, ustaların ise müşteri, randevu, iş ve ödeme süreçlerini yönettiği web ve mobil uygulamadır.

<p align="center">
  <a href="https://islik-cloud.vercel.app/"><strong>Canlı web uygulamasını aç →</strong></a>
  &nbsp;·&nbsp;
  <a href="docs/demo-guide.md"><strong>3 dakikalık demo</strong></a>
  &nbsp;·&nbsp;
  <a href="docs/">Teknik belgeler</a>
  &nbsp;·&nbsp;
  <a href="#testler">Testler</a>
</p>

## Portföy özeti

| | |
| --- | --- |
| **Problem** | Küçük servis işletmelerinde müşteri, randevu, iş emri ve ödeme takibinin farklı kanallara dağılması |
| **Çözüm** | Aynı iş akışını React web, Expo mobil ve Express API üzerinde birleştiren uçtan uca ürün |
| **Zor mühendislik kararları** | Mobil güvenli oturum taşıma, çevrimdışı önbellek, fotoğraf sıkıştırma, atomik ödeme/iş akışları ve üretim ortamı dayanıklılığı |
| **Doğrulama** | API, web, Android ve iOS için bağımsız GitHub Actions kontrolleri; Supertest ve Node.js testleri |

Bu proje; yalnızca arayüz değil, veri modeli, API güvenliği, mobil dayanıklılık, CI ve bulut dağıtımıyla birlikte çalışan bir ürünü uçtan uca geliştirebildiğimi gösterir.

## Canlı Sistem

- Web: https://islik-cloud.vercel.app
- API: https://islik-cloud-api.onrender.com
- Sağlık: https://islik-cloud-api.onrender.com/health

Render ücretsiz planda uykuya geçebildiği için ilk bulut isteği zaman zaman gecikebilir. Uygulama bu durum için uzun istek zaman aşımı, bağlantı durumu ve yeniden deneme akışı içerir.

## Sürüm

Güncel mobil uygulama sürümü `1.2.0`'dır. Mobil istemci Expo ile gerçek Android/iOS uygulaması olarak yazılmıştır; Capacitor kullanılmaz.

## Özellikler

### Müşteri

- Üye olmadan servis talebi oluşturma
- Ürün kategorisi, marka, model, adres ve arıza açıklaması ekleme
- Kameradan veya galeriden en fazla üç arıza fotoğrafı ekleme
- Fotoğrafları cihazda otomatik küçültme ve sıkıştırma
- Takip kodu ve telefonla talep durumunu izleme
- Randevu ve durum geçmişini görme

### Usta

- Güvenli kayıt, giriş ve kalıcı oturum
- Bugün, açık, acil, ödeme bekleyen ve tamamlanan talep panoları
- Müşteri oluşturma, düzenleme, arama ve silme
- Müşteri kartından doğrudan talep açma
- Talep oluşturma, düzenleme, fotoğraf ekleme ve hızlı durum işlemleri
- Geçmiş randevu oluşturmayı engelleme; mevcut eski kaydı bozmadan düzenleyebilme
- Ödenmedi, kısmi ödendi ve ödendi takibi
- Kısmi ödemede kalan tutarı gösterme
- Türkçe karakterleri dikkate alan müşteri ve talep araması
- Müşteri ve talep verilerini CSV olarak dışa aktarma/paylaşma

### Mobil Dayanıklılık

- Token'ı iOS Keychain / Android Keystore destekli `expo-secure-store` içinde saklama
- Daha önce AsyncStorage'da saklanan token'ı güvenli alana otomatik taşıma
- Son müşteri ve talep listesini yerel önbellekten gösterme
- Bulut API'yi varsayılan kullanma; geliştirmede LAN API'yi otomatik algılama
- Bağlantı kesildiğinde açık durum ve yeniden deneme seçeneği
- Android ve iOS üretim bundle doğrulaması

## Teknolojiler

- Web: React, Vite, CSS
- Mobil: Expo, React Native, SecureStore, Image Picker, Image Manipulator
- API: Node.js, Express, Prisma, JWT, bcryptjs
- Veritabanı: PostgreSQL
- Test: Node.js test runner, Supertest
- CI: GitHub Actions üzerinde API, web, Android ve iOS kontrolleri
- Barındırma: Vercel, Render, EAS Build

## Proje Yapısı

```text
Servis Defteri/
├── .github/workflows/
│   ├── api-ci.yml
│   ├── mobile-ci.yml
│   └── web-ci.yml
├── apps/
│   ├── api/
│   ├── mobile/
│   └── web/
├── docs/
├── docker-compose.yml
├── Servis Defteri Baslat.cmd
└── Servis Defteri Mobil Baslat.cmd
```

## En Kolay Yerel Çalıştırma

Windows'ta masaüstündeki şu dosyalardan birini aç:

- Web + API: `Servis Defteri Baslat.cmd`
- Expo mobil geliştirme: `Servis Defteri Mobil Baslat.cmd`

Elle başlatmak için önce PostgreSQL ve API:

```bash
docker compose up -d postgres
cd apps/api
npm ci
npx prisma migrate deploy
npm run dev
```

Yeni terminalde web:

```bash
cd apps/web
npm ci
npm run dev
```

Yeni terminalde mobil:

```bash
cd apps/mobile
npm ci
npm start
```

Yerel adresler:

- Web: `http://localhost:5173`
- API: `http://localhost:4000`
- API sağlık: `http://localhost:4000/health`

Fiziksel telefonda Expo Go kullanırken telefon ve bilgisayar aynı Wi-Fi ağında olmalıdır. Normal APK/mağaza sürümü doğrudan bulut API'ye bağlanır.

## Ortam Değişkenleri

API için `apps/api/.env`:

```env
DATABASE_URL="postgresql://islik:islik_password@localhost:5432/islik_cloud"
JWT_SECRET="yalnizca-yerel-gelistirme-icin-guclu-bir-secret"
CORS_ORIGIN="http://localhost:5173"
PUBLIC_SERVICE_OWNER_EMAIL="usta@example.com"
```

Web için `apps/web/.env`:

```env
VITE_API_URL="http://localhost:4000"
```

Mobil için `apps/mobile/.env.local`:

```env
EXPO_PUBLIC_API_URL="https://islik-cloud-api.onrender.com"
```

`PUBLIC_SERVICE_OWNER_EMAIL`, müşterilerin üye olmadan açtığı taleplerin hangi usta hesabına düşeceğini belirler. Gerçek secret ve parolalar repoya eklenmemelidir.

## Testler

```bash
cd apps/api
npm test
```

```bash
cd apps/web
npm run lint
npm run build
```

```bash
cd apps/mobile
npm run doctor
npx expo export --platform android
npx expo export --platform ios
```

API testleri ana veriyi silmemek için yalnızca yerel `islik_test` PostgreSQL şemasını kullanır.

## API

```http
GET  /health
GET  /ready

POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

POST /api/public/requests
GET  /api/public/requests/:requestCode?phone=...

GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PUT    /api/customers/:id
DELETE /api/customers/:id

GET    /api/jobs
POST   /api/jobs
GET    /api/jobs/:id
PUT    /api/jobs/:id
DELETE /api/jobs/:id
```

Müşteri ve talep endpointleri JWT ister. Her sorgu giriş yapan kullanıcıya göre filtrelenir; başka bir ustanın kayıtlarına kimlik üzerinden erişim engellenir ve integration testleriyle doğrulanır.

## Yayın

Yayın öncesi bütün adımlar [deploy-checklist.md](docs/deploy-checklist.md) içinde, cihaz ve tarayıcı kabul senaryoları ise [manual-test-plan.txt](docs/manual-test-plan.txt) içindedir.
