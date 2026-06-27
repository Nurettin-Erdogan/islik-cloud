# İşlik Cloud - Portföy Özeti

## Kısa Açıklama

İşlik Cloud, küçük servis işletmeleri için geliştirilen full-stack müşteri ve iş takip uygulamasıdır.

Uygulama; kullanıcı kaydı, giriş, müşteri yönetimi, iş kaydı yönetimi, ödeme durumu takibi, arama/filtreleme ve kullanıcıya özel veri izolasyonu özelliklerini içerir.

## Canlı Linkler

- Frontend: https://islik-cloud.vercel.app
- Backend API: https://islik-cloud-api.onrender.com
- Health check: https://islik-cloud-api.onrender.com/health

## Teknik Stack

- Frontend: React, Vite, CSS
- Backend: Node.js, Express.js
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT, bcryptjs
- Test: Node.js test runner, Supertest
- DevOps: GitHub Actions, Docker Compose
- Deploy: Vercel, Render, Render PostgreSQL

## Öne Çıkan Teknik Noktalar

- Monorepo yapısı kullanıldı.
- Backend ve frontend ayrı uygulamalar olarak geliştirildi.
- PostgreSQL veritabanı Prisma migration yapısıyla yönetildi.
- Kullanıcı kayıt/giriş akışı JWT ile kuruldu.
- Customer ve Job kayıtları kullanıcıya özel izole edildi.
- API endpointleri integration testleriyle kontrol edildi.
- Frontend component yapısına ayrıldı.
- Backend Render'a, frontend Vercel'e deploy edildi.

## Portföyde Kullanılabilecek Açıklama

İşlik Cloud, küçük servis işletmelerinin müşteri ve iş kayıtlarını yönetebilmesi için geliştirdiğim full-stack bir web uygulamasıdır. Projede React/Vite frontend, Express.js backend, Prisma ORM ve PostgreSQL veritabanı kullanıldı. Kullanıcılar kayıt olabilir, giriş yapabilir, kendi müşteri ve iş kayıtlarını oluşturup yönetebilir. Veriler kullanıcı bazında izole edilir; bir kullanıcı başka kullanıcının verilerine erişemez. Proje GitHub Actions ile test/build süreçlerine ve Render + Vercel üzerinden canlı deploy yapısına sahiptir.

## Demo Notu

Render Free instance uyku moduna geçebildiği için ilk API isteği 30-60 saniye gecikebilir.
