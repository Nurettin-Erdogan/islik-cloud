# İşlik Cloud

İşlik Cloud; küçük servis işletmeleri için geliştirilen müşteri, iş, ödeme ve operasyon takip panelidir.

Bu proje, mevcut local-first İşlik fikrinin full-stack cloud sürümüdür. Amaç; teknik servis, tamirci, saha hizmeti veren küçük işletmeler ve bireysel çalışanlar için müşteri ve iş süreçlerini tek panelden yönetilebilir hale getirmektir.

## Özellikler

- Müşteri oluşturma
- Müşteri listeleme
- Müşteri silme
- İş kaydı oluşturma
- İş listeleme
- İş silme
- İş durumunu tamamlandı yapma
- Ödeme durumunu ödendi yapma
- Dashboard istatistikleri
- PostgreSQL veritabanı
- Prisma migration yapısı
- API integration testleri
- Frontend build kontrolü
- GitHub Actions CI

## Teknolojiler

### Frontend

- React
- Vite
- CSS
- Fetch API

### Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- CORS
- dotenv

### Test ve DevOps

- Node.js test runner
- Supertest
- Docker Compose
- GitHub Actions

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
│   │   │   ├── routes/
│   │   │   ├── app.js
│   │   │   └── server.js
│   │   ├── tests/
│   │   ├── .env.example
│   │   └── package.json
│   └── web/
│       ├── src/
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

Frontend'i başlat:

```bash
npm run dev
```

Frontend varsayılan olarak şu adreste çalışır:

```text
http://localhost:5173
```

## Environment Variables

### Backend

`apps/api/.env`

```env
DATABASE_URL="postgresql://islik:islik_password@localhost:5432/islik_cloud"
```

### Frontend

`apps/web/.env`

```env
VITE_API_URL=http://localhost:4000
```

## API Endpointleri

### Health

```http
GET /health
```

### Customers

```http
GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PUT    /api/customers/:id
DELETE /api/customers/:id
```

Örnek müşteri oluşturma:

```bash
curl -X POST http://localhost:4000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Ahmet Yılmaz","phone":"05551234567","address":"İstanbul","note":"Test müşterisi"}'
```

### Jobs

```http
GET    /api/jobs
POST   /api/jobs
GET    /api/jobs/:id
PUT    /api/jobs/:id
DELETE /api/jobs/:id
```

Örnek iş oluşturma:

```bash
curl -X POST http://localhost:4000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"customerId":"CUSTOMER_ID","title":"Klima bakımı","description":"Yıllık servis kontrolü","price":1200,"status":"pending","paymentStatus":"unpaid"}'
```

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
- Silme ve durum aksiyonları eklendi

## Sıradaki Aşamalar

- Kullanıcı kayıt / giriş sistemi
- JWT authentication
- Workspace / işletme yapısı
- Yetkilendirme
- Müşteri düzenleme ekranı
- İş düzenleme ekranı
- Arama ve filtreleme
- Deploy
- Demo kullanıcı
- Ekran görüntüleri
- Swagger / OpenAPI dokümantasyonu

## Not

Bu proje aktif geliştirme aşamasındadır. Amaç, mevcut İşlik fikrini production'a daha yakın full-stack bir cloud uygulamasına dönüştürmektir.
