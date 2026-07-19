# Değişiklik Günlüğü

## 1.2.1 - 2026-07-19

### İyileştirildi

- Expo SDK 54 güvenli yama sürümü `54.0.36` ile eşitlendi
- Android sürüm kodu ve iOS build numarası yeni mağaza paketleri için artırıldı
- Android release paketinden mikrofon ve ekran üstü pencere izinleri çıkarıldı
- Dependabot, Expo ve Prisma büyük sürümlerini uyumsuz tekil PR'lar olarak açmayacak şekilde düzenlendi

## 1.2.0 - 2026-07-14

### Yeni

- Web müşteri talebine üç fotoğraf ekleme ve tarayıcıda otomatik sıkıştırma
- Mobilde büyük kamera/galeri fotoğraflarını otomatik yeniden boyutlandırma
- Webde CSV indirme, mobilde gerçek CSV dosyası paylaşma
- Mobil token için SecureStore ve eski oturumu güvenli alana taşıma
- API `/ready` veritabanı hazırlık kontrolü
- Android ve iOS bundle doğrulayan Mobile CI

### İyileştirildi

- Usta kayıt parolası en az 8, en fazla 128 karakter olarak güçlendirildi
- Ad, telefon, adres, not, talep, açıklama ve ücret sınırları istemci/API boyunca eşitlendi
- Mevcut geçmiş randevu korunarak kayıt düzenlenebilir hale getirildi
- Public takip cevabından telefon ve adres çıkarıldı
- Mobil bağlantı, çevrimdışı önbellek ve CSV paylaşım akışı iyileştirildi
- Web oturumu sona erdiğinde otomatik ve anlaşılır yeniden giriş akışı eklendi
- Kurulum, yayın ve manuel kabul belgeleri güncellendi

### Güvenlik ve Dayanıklılık

- 4 MB istek gövdesi sınırı ve anlaşılır `413` cevabı
- Auth/public rate limit, güvenlik başlıkları ve hassas query değerlerini gizleyen loglama
- Graceful API shutdown ve Prisma bağlantı kapatma
- Test verileri ana şemadan ayrılarak yalnızca yerel `islik_test` şemasına taşındı
- CSV formül enjeksiyonuna karşı hücre koruması

## 1.1.0

- Expo tabanlı gerçek Android/iOS uygulaması
- Müşteri talep ve takip alanı
- Usta mobil panosu, fotoğraflar, randevu ve ödeme yönetimi
- Yerel/bulut API seçimi ve bağlantı kurtarma
