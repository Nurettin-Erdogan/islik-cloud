# Servis Defteri Yayın Kontrol Listesi

## 1. API Ortamı

Render/API ortamında aşağıdaki değişkenleri kontrol et:

```env
NODE_ENV="production"
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="en-az-32-byte-rastgele-production-secret"
CORS_ORIGIN="https://islik-cloud.vercel.app"
PUBLIC_SERVICE_OWNER_EMAIL="talep-alacak-usta@example.com"
AUTH_RATE_LIMIT_WINDOW_MS="900000"
AUTH_RATE_LIMIT_MAX="30"
PUBLIC_REQUEST_RATE_LIMIT_WINDOW_MS="900000"
PUBLIC_REQUEST_RATE_LIMIT_MAX="60"
```

- `JWT_SECRET` yerel secret ile aynı olmamalı ve repoda bulunmamalı.
- `PUBLIC_SERVICE_OWNER_EMAIL` production veritabanında kayıtlı bir usta hesabı olmalı.
- Birden fazla web origin gerekiyorsa `CORS_ORIGIN` virgülle ayrılmalı.
- Yayından önce PostgreSQL yedeği veya sağlayıcı snapshot'ı alınmalı.

## 2. API Kurulum ve Başlatma

```bash
cd apps/api
npm ci
npx prisma generate
npx prisma migrate deploy
npm test
npm start
```

Kontroller:

```http
GET /health
GET /ready
```

`/health` API işleminin, `/ready` ise veritabanı bağlantısının hazır olduğunu doğrular. İkisi de `200` dönmeden frontend yayınını tamamlanmış sayma.

## 3. Web Ortamı

Vercel ortam değişkeni:

```env
VITE_API_URL="https://islik-cloud-api.onrender.com"
```

Yerel üretim kontrolü:

```bash
cd apps/web
npm ci
npm run lint
npm run build
```

## 4. Mobil Ortam ve Paket

EAS `preview` ve `production` profillerinde:

```env
EXPO_PUBLIC_API_URL="https://islik-cloud-api.onrender.com"
```

Kontrol ve paket komutları:

```bash
cd apps/mobile
npm ci
npm run doctor
npx expo export --platform android
npx expo export --platform ios
npm run build:apk
```

- Android APK gerçek cihazda kurulmalı.
- iOS Expo Go veya TestFlight üzerinde açılmalı.
- Production uygulamasında geliştirici sunucu ayarı görünmemeli.
- Kamera ve galeri izin metinleri doğru görünmeli.

## 5. Kabul Testi

- Yeni usta kaydı ve mevcut hesap girişi çalışıyor.
- Yanlış parola anlaşılır hata gösteriyor.
- Müşteri talebi üç fotoğrafla oluşturulabiliyor.
- Takip kodu ve telefonla talep görülebiliyor.
- Public takip cevabı telefon ve adres döndürmüyor.
- Usta talebi görüyor, durum ve randevu değiştirebiliyor.
- Geçmiş tarihli yeni randevu engelleniyor.
- Kısmi ödeme kaydoluyor ve kalan tutar doğru görünüyor.
- Türkçe karakterli müşteri ve talep araması çalışıyor.
- CSV dışa aktarma/paylaşma çalışıyor.
- Başka usta hesabı diğer hesabın verisini göremiyor.
- Oturum kapatma sonrası korumalı ekran açılamıyor.

Detaylı senaryolar `docs/manual-test-plan.txt` içindedir.

## 6. Yayın Sonrası

- GitHub Actions içindeki API, Web ve Mobile CI yeşil olmalı.
- Vercel ve Render deploy loglarında hata olmamalı.
- Canlı `/ready` çağrısı `200` dönmeli.
- Vercel müşteri talebi ve usta giriş akışı canlı API ile denenmeli.
- Yeni APK sürüm, paket adı ve bulut API adresi kontrol edilmeli.
- Hata halinde son çalışan commit/deploy sürümüne dönülmeli; migration geri alınmadan önce veritabanı yedeği kullanılmalı.
