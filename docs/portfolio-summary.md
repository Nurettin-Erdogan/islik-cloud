# Servis Defteri - Portföy Özeti

## Kısa Açıklama

Servis Defteri, küçük servis işletmeleri için geliştirilen full-stack web ve gerçek mobil servis talep uygulamasıdır.

Uygulama; müşterinin fotoğraflı arıza talebi açıp takip edebilmesini, ustanın müşteri, randevu, iş ve kısmi ödeme süreçlerini yönetebilmesini sağlar.

## Canlı Linkler

- Frontend: https://islik-cloud.vercel.app
- Backend API: https://islik-cloud-api.onrender.com
- Health check: https://islik-cloud-api.onrender.com/health

## Teknik Stack

- Frontend: React, Vite, CSS
- Mobile: Expo, React Native, SecureStore
- Backend: Node.js, Express.js
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT, bcryptjs
- Test: Node.js test runner, Supertest
- DevOps: GitHub Actions, Docker Compose
- Deploy: Vercel, Render, Render PostgreSQL

## Öne Çıkan Teknik Noktalar

- Monorepo yapısı kullanıldı.
- Web, mobil ve API ayrı uygulamalar olarak geliştirildi.
- PostgreSQL veritabanı Prisma migration yapısıyla yönetildi.
- Kullanıcı kayıt/giriş akışı JWT ile kuruldu.
- Customer ve Job kayıtları kullanıcıya özel izole edildi.
- API endpointleri integration testleriyle kontrol edildi.
- Büyük fotoğraflar web ve mobilde cihaz üzerinde sıkıştırıldı.
- Android ve iOS bundle üretimi CI ile doğrulandı.
- Frontend component yapısına ayrıldı.
- Backend Render'a, frontend Vercel'e deploy edildi.

## Portföyde Kullanılabilecek Açıklama

Servis Defteri, müşterilerin fotoğraflı servis talebi açıp takip edebildiği, ustaların müşteri, randevu, iş ve ödeme süreçlerini yönetebildiği full-stack web ve mobil uygulamadır. React/Vite web istemcisi ile Expo/React Native mobil istemcisi aynı Express, Prisma ve PostgreSQL API'sini kullanır. JWT oturumu, kullanıcı bazlı veri izolasyonu, çevrimdışı mobil önbellek, SecureStore ve GitHub Actions kontrolleriyle uçtan uca geliştirildi.

## Demo Notu

Render Free instance uyku moduna geçebildiği için ilk API isteği 30-60 saniye gecikebilir.
