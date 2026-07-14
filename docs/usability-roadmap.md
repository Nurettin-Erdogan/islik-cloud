# Servis Defteri Ürün Durumu ve Yol Haritası

## 1.2.0 ile Tamamlananlar

- Müşteri ve usta için ayrı, mobil öncelikli giriş akışı
- Üye olmadan arıza talebi oluşturma ve takip koduyla izleme
- Web ve mobilde en fazla üç fotoğraf ekleme
- Büyük fotoğrafları cihazda otomatik küçültme ve sıkıştırma
- Müşteri, talep, randevu, öncelik ve ödeme yönetimi
- Kısmi ödeme ve kalan tutar görünümü
- Türkçe karakterleri ve tek harflik sorguları destekleyen arama
- Bugün, açık, acil, ödeme bekleyen ve tamamlanan iş panoları
- Web ve mobil CSV dışa aktarma
- Mobil çevrimdışı önbellek, bağlantı durumu ve yeniden deneme
- Mobil token'ı SecureStore içinde saklama
- Geçmiş randevu ve alan uzunlukları için istemci + API doğrulaması
- Kullanıcı bazlı veri izolasyonu ve public cevaplarda kişisel veri azaltma
- API rate limit, 4 MB istek sınırı, güvenli loglama ve graceful shutdown
- API, web, Android ve iOS için otomatik CI kontrolleri

## Production İçin Öncelikli Sonraki Yatırımlar

1. Render ücretsiz katmanından sürekli açık bir API planına geçmek. Bu, ilk girişteki soğuk başlangıç gecikmesini kaldırır.
2. E-posta doğrulama ve parola sıfırlama eklemek. Şu an unutulan parola için self-servis kurtarma yoktur.
3. İşletme/workspace ve çalışan rolleri eklemek. Mevcut model her usta hesabını ayrı veri sahibi kabul eder.
4. Push bildirimleri eklemek. Yeni müşteri talebi, yaklaşan randevu ve geciken ödeme cihazdan bildirilebilir.
5. Ödeme hareketleri tablosu eklemek. Mevcut sürüm toplam fiyat ve ödenen tutarı saklar; ayrı tahsilat geçmişi tutmaz.
6. Takvim görünümü ve uygun randevu aralıkları eklemek.
7. OpenAPI dokümanı, merkezi hata izleme ve uptime alarmı eklemek.
8. Android Play Store ve iOS TestFlight/App Store dağıtımını tamamlamak.

## Ürün Kararı

Ana deneyim mobil uygulamadır. Web sürümü masaüstünde yoğun kayıt yönetimi ve müşteriye bağlantı gönderme için korunur. Aynı API ve veri modeli iki istemci tarafından kullanılmaya devam eder; iki ayrı backend oluşturulmaz.
