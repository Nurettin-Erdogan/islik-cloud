# Servis Defteri

<p align="center">
  <a href="https://github.com/Nurettin-Erdogan/islik-cloud/actions/workflows/api-ci.yml"><img src="https://github.com/Nurettin-Erdogan/islik-cloud/actions/workflows/api-ci.yml/badge.svg?branch=main" alt="API CI"></a>
  <a href="https://github.com/Nurettin-Erdogan/islik-cloud/actions/workflows/web-ci.yml"><img src="https://github.com/Nurettin-Erdogan/islik-cloud/actions/workflows/web-ci.yml/badge.svg?branch=main" alt="Web CI"></a>
  <a href="https://github.com/Nurettin-Erdogan/islik-cloud/actions/workflows/mobile-ci.yml"><img src="https://github.com/Nurettin-Erdogan/islik-cloud/actions/workflows/mobile-ci.yml/badge.svg?branch=main" alt="Mobil CI"></a>
  <a href="https://islik-cloud.vercel.app/"><img src="https://img.shields.io/badge/canl%C4%B1%20web-Vercel-0f766e.svg" alt="Canlı web"></a>
  <img src="https://img.shields.io/badge/mobil-Expo%201.2.1-0f766e.svg" alt="Expo 1.2.1">
</p>

Servis Defteri; müşterilerin servis talebi oluşturup takip edebildiği, ustaların ise müşteri, randevu, iş ve ödeme süreçlerini yönettiği **web + mobil + API** ürünüdür.

<p align="center">
  <a href="https://islik-cloud.vercel.app/"><strong>Canlı web uygulamasını aç →</strong></a>
  &nbsp;·&nbsp;
  <a href="docs/demo-guide.md"><strong>3 dakikalık demo</strong></a>
  &nbsp;·&nbsp;
  <a href="docs/">Teknik belgeler</a>
  &nbsp;·&nbsp;
  <a href="#testler">Testler</a>
</p>

<p align="center">
  <img src="docs/screenshots/customer-request.png" alt="Servis Defteri müşteri servis talebi ekranı" width="900">
</p>

## Portföy özeti

| | |
| --- | --- |
| **Problem** | Küçük servis işletmelerinde müşteri, randevu, iş emri ve ödeme takibinin farklı kanallara dağılması |
| **Çözüm** | Aynı iş akışını React web, Expo mobil ve Express API üzerinde birleştiren uçtan uca ürün |
| **Zor mühendislik kararları** | Mobil SecureStore oturumu, çevrimdışı önbellek, fotoğraf sıkıştırma, tenant izolasyonu, üretim dayanıklılığı |
| **Doğrulama** | API / web / Android / iOS CI; Supertest entegrasyon testleri; canlı Vercel + Render |

Bu depo özel tutulur; canlı demo herkese açıktır. Ürünü uçtan uca (veri modeli, API güvenliği, mobil, CI, bulut) geliştirebildiğimi göstermek için tasarlandı.

## English

**Servis Defteri** is an end-to-end ops product for small service businesses: customer requests, appointments, job status, and payments — same workflow on React web, Expo mobile, and an Express/Prisma API. Live web: [islik-cloud.vercel.app](https://islik-cloud.vercel.app/). Source stays private; architecture and demos are documented here.

## Canlı Sistem

- Web: https://islik-cloud.vercel.app
- API: https://islik-cloud-api.onrender.com
- Sağlık: https://islik-cloud-api.onrender.com/health
- Hazırlık: https://islik-cloud-api.onrender.com/ready

Render ücretsiz planda uykuya geçebildiği için ilk bulut isteği gecikebilir. İstemciler uzun zaman aşımı ve yeniden deneme kullanır.

## Güvenlik notları (kısa)

- API: JWT + bcrypt (cost 12), CORS allowlist, auth/public rate limit, güvenlik başlıkları, kullanıcı bazlı tenant izolasyonu
- Mobil: token `expo-secure-store` (Keychain / Keystore)
- Web: JWT şu an `localStorage`’da — XSS yüzeyini bilerek kabul edilen vitrin/demo tercihi; httpOnly cookie’ye geçiş roadmap’te
- Ortam şablonu: `apps/api/.env.example` (JWT, CORS, rate-limit alanları)

## Sürüm

Mobil uygulama `1.2.1` · Expo (Capacitor yok)

## Özellikler

### Müşteri

- Üye olmadan servis talebi
- Kategori, marka, model, adres, arıza açıklaması
- En fazla üç sıkıştırılmış arıza fotoğrafı
- Takip kodu + telefon ile durum izleme

### Usta

- Kayıt / giriş, panolar (bugün, açık, acil, ödeme, tamamlanan)
- Müşteri ve talep CRUD, arama, CSV dışa aktarma
- Ödeme durumları (ödenmedi / kısmi / ödendi)

### Mobil dayanıklılık

- SecureStore + legacy migrate
- Yerel liste önbelleği, LAN API algılama, bağlantı kopunca yeniden deneme

## Teknolojiler

Web: React, Vite · Mobil: Expo, SecureStore · API: Node.js, Express, Prisma, JWT · DB: PostgreSQL · CI: GitHub Actions · Host: Vercel, Render, EAS

## Proje Yapısı

```text
apps/
├── api/      Express + Prisma
├── web/      React (Vite) PWA
└── mobile/   Expo
docs/         demo ve teknik belgeler
```

## Yerel çalıştırma

```bash
# Windows: Servis Defteri Baslat.cmd  (repo kökünden)
docker compose -p islik-cloud up -d postgres
cd apps/api && cp .env.example .env && npm ci && npx prisma migrate deploy && npm run dev
cd apps/web && npm ci && npm run dev
```

## Testler

```bash
cd apps/api && npm test
cd apps/web && npm test
cd apps/mobile && npm test
```

## Lisans

MIT — ayrıntılar `LICENSE` dosyasında. Güvenlik bildirimleri için `SECURITY.md`.
