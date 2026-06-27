# İşlik Cloud

İşlik Cloud; küçük servis işletmeleri için geliştirilen müşteri, iş, ödeme ve operasyon takip panelidir.

Bu proje, mevcut local-first İşlik fikrinin full-stack cloud sürümüdür. Amaç; teknik servis, tamirci, saha hizmeti veren küçük işletmeler ve bireysel çalışanlar için müşteri ve iş süreçlerini tek panelden yönetilebilir hale getirmektir.

## Canlı Demo

- Frontend: https://islik-cloud.vercel.app
- Backend API: https://islik-cloud-api.onrender.com
- Health check: https://islik-cloud-api.onrender.com/health

Not: Backend Render Free üzerinde çalıştığı için uzun süre istek gelmezse uyku moduna geçebilir. İlk istek 30-60 saniye gecikebilir.

## Durum

Proje aktif geliştirme aşamasındadır ve şu anda deploy edilmiş çalışan bir full-stack MVP seviyesindedir.

- React frontend
- Express backend
- PostgreSQL veritabanı
- Prisma ORM ve migration yapısı
- JWT tabanlı kullanıcı girişi
- Kullanıcıya özel müşteri ve iş kayıtları
- API integration testleri
- GitHub Actions CI
- Render üzerinde backend deploy
- Vercel üzerinde frontend deploy

## Özellikler

### Kullanıcı ve Güvenlik

- Kullanıcı kayıt olma
- Kullanıcı giriş yapma
- JWT token ile oturum yönetimi
- Korumalı API endpointleri
- Kullanıcıya özel veri izolasyonu
- Başka kullanıcının müşteri veya iş kayıtlarına erişimi engelleme

### Müşteri Yönetimi

- Müşteri oluşturma
- Müşteri listeleme
- Müşteri düzenleme
- Müşteri silme
- Müşteri arama

### İş Yönetimi

- İş kaydı oluşturma
- İş listeleme
- İş düzenleme
- İş silme
- İş durumunu değiştirme
- Ödeme durumunu değiştirme
- Öncelik ve randevu alanları
- İş arama ve filtreleme

### Panel

- Müşteri sayısı
- İş kaydı sayısı
- Bekleyen iş sayısı
- Ödenmiş gelir toplamı
- Dashboard istatistikleri

## Teknolojiler

### Frontend

- React
- Vite
- CSS
- Fetch API
- Component tabanlı yapı
- Vercel deploy

### Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT
- bcryptjs
- CORS
- dotenv
- Render deploy

### Test ve DevOps

- Node.js test runner
- Supertest
- Docker Compose
- GitHub Actions
- Render PostgreSQL

## Deploy Mimarisi

```text
Kullanıcı
   |
   v
Vercel Frontend
   |
   v
Render Express API
   |
   v
Render PostgreSQL
```

Production ortamında frontend `VITE_API_URL` ile Render API adresine bağlanır. Backend tarafında `CORS_ORIGIN` ile Vercel domaini izinli origin olarak tanımlanır.

## Proje Yapısı

```text
islik-cloud/
├── .github/
│   └── workflows/
│       ├── api-ci.yml
│       └── web-ci.yml
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── migrations/
│   │   │   └── schema.prisma
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── app.js
│   │   │   └── server.js
│   │   ├── tests/
│   │   ├── .env.example
│   │   └── package.json
│   └── web/
│       ├── src/
│       │   ├── components/
│       │   ├── services/
│       │   ├── App.jsx
│       │   └── App.css
│       ├── .env.example
│       └── package.json
├── docs/
├── docker-compose.yml
└── README.md
```

## Kurulum

Projeyi klonla:

```bash
git clone https://github.com/Nurettin-Erdogan/islik-cloud.git
cd islik-cloud
```

PostgreSQL container'ını başlat:

```bash
docker compose up -d postgres
```

Backend bağımlılıklarını kur:

```bash
cd apps/api
npm ci
```

Backend environment dosyasını oluştur:

```bash
cp .env.example .env
```

Backend `.env` örneği:

```env
DATABASE_URL="postgresql://islik:islik_password@localhost:5432/islik_cloud"
JWT_SECRET="local-dev-secret"
```

Prisma migration çalıştır:

```bash
npx prisma migrate dev
```

Backend'i başlat:

```bash
npm run dev
```

Backend varsayılan olarak şu adreste çalışır:

```text
http://localhost:4000
```

Yeni bir terminal açıp frontend bağımlılıklarını kur:

```bash
cd apps/web
npm ci
```

Frontend environment dosyasını oluştur:

```bash
cp .env.example .env
```

Frontend `.env` örneği:

```env
VITE_API_URL=http://localhost:4000
```

Frontend'i başlat:

```bash
npm run dev
```

Frontend varsayılan olarak şu adreste çalışır:

```text
http://localhost:5173
```

## API Endpointleri

### Health

```http
GET /health
```

### Auth

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Customers

Bu endpointler authentication gerektirir.

```http
GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PUT    /api/customers/:id
DELETE /api/customers/:id
```

### Jobs

Bu endpointler authentication gerektirir.

```http
GET    /api/jobs
POST   /api/jobs
GET    /api/jobs/:id
PUT    /api/jobs/:id
DELETE /api/jobs/:id
```

## Veri İzolasyonu

Uygulamada her kullanıcı yalnızca kendi müşteri ve iş kayıtlarını görebilir.

- Customer kayıtları `userId` ile kullanıcıya bağlanır.
- Job kayıtları Customer ilişkisi üzerinden kullanıcıya göre filtrelenir.
- Başka kullanıcının customer veya job id'si ile işlem yapılması 404 veya 400 ile engellenir.
- Bu davranış API integration testleriyle kontrol edilir.

## Testler

Backend testlerini çalıştır:

```bash
cd apps/api
npm test
```

Frontend build kontrolü:

```bash
cd apps/web
npm run build
```

## GitHub Actions

Projede iki ayrı CI workflow vardır.

### API CI

- `npm ci`
- `npx prisma migrate deploy`
- `npx prisma generate`
- `npm test`
- API health check

### Web CI

- `npm ci`
- `npm run build`

## Geliştirme Geçmişi

Bu proje adım adım PR akışıyla geliştirilmiştir:

- Proje yapısı oluşturuldu
- Express API eklendi
- API health endpoint eklendi
- API CI eklendi
- React frontend eklendi
- Web CI eklendi
- PostgreSQL + Prisma eklendi
- Customer ve Job modelleri oluşturuldu
- Customer CRUD API yazıldı
- Job CRUD API yazıldı
- API integration testleri eklendi
- Frontend backend API'ye bağlandı
- Düzenleme, silme ve durum aksiyonları eklendi
- Arama ve filtreleme eklendi
- JWT authentication eklendi
- Kullanıcıya özel veri izolasyonu eklendi
- Frontend component yapısı düzenlendi
- Demo seed scripti eklendi
- Render backend deploy tamamlandı
- Vercel frontend deploy tamamlandı

## Sıradaki Aşamalar

- Ekran görüntüleri
- Swagger / OpenAPI dokümantasyonu
- Workspace / işletme yapısı
- Rol ve yetki yönetimi
- Production secret rotasyonu
- Custom domain

## Not

Bu proje aktif geliştirme aşamasındadır. Amaç, mevcut İşlik fikrini production'a daha yakın full-stack bir cloud uygulamasına dönüştürmektir.
