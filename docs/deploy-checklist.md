# Deploy Checklist

Bu doküman İşlik Cloud'u deploy'a hazırlamak için takip edilecek kısa kontrol listesidir.

## 1. Backend ortam değişkenleri

Production ortamında backend için gerekli değişkenler:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="strong-production-secret"
NODE_ENV="production"
CORS_ORIGIN="https://frontend-domain.example.com"
```

Opsiyonel auth rate limit ayarları:

```env
AUTH_RATE_LIMIT_WINDOW_MS="900000"
AUTH_RATE_LIMIT_MAX="30"
```

Not: `JWT_SECRET` güçlü ve tahmin edilemez olmalıdır. Repo içine gerçek secret yazılmamalıdır. Production ortamında `JWT_SECRET` boşsa API başlatılmamalıdır.

`CORS_ORIGIN`, frontend'in production adresi olmalıdır. Birden fazla frontend adresi gerekiyorsa virgülle ayrılabilir. Production ortamında `CORS_ORIGIN` boş bırakılırsa tarayıcı origin'lerinden gelen istekler reddedilir.

## 2. Frontend ortam değişkenleri

Production frontend için API adresi ayarlanmalıdır:

```env
VITE_API_URL="https://api-domain.example.com"
```

## 3. Database migration

Production deploy sırasında Prisma migration çalıştırılmalıdır:

```bash
cd apps/api
npx prisma migrate deploy
npx prisma generate
```

## 4. Backend build/test kontrolü

```bash
cd apps/api
npm ci
npm test
npm start
```

## 5. Frontend build kontrolü

```bash
cd apps/web
npm ci
npm run lint
npm run build
```

## 6. Health check

Backend deploy sonrası kontrol:

```http
GET /health
```

Beklenen cevap:

```json
{
  "status": "ok",
  "service": "islik-cloud-api"
}
```

## 7. Manuel demo kontrolü

- Kullanıcı kayıt olabiliyor mu?
- Kullanıcı giriş yapabiliyor mu?
- Dashboard token yokken açılmıyor mu?
- Müşteri ekleme çalışıyor mu?
- İş ekleme çalışıyor mu?
- İş önceliği ve randevu zamanı kaydedilip listede görünüyor mu?
- Düzenleme, silme, filtreleme çalışıyor mu?
- Başka kullanıcı başka veriyi göremiyor mu?

## 8. Deploy için sıradaki karar

Önerilen basit başlangıç:

- Frontend: Vercel veya Netlify
- Backend: Render, Railway veya Fly.io
- Database: Railway PostgreSQL, Render PostgreSQL veya Supabase PostgreSQL

İlk deploy için en kolay akış genelde:

```text
Frontend: Vercel
Backend: Render
Database: Render PostgreSQL veya Railway PostgreSQL
```
