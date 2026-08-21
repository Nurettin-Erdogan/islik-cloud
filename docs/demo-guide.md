# 3 Dakikalık Demo Akışı

Bu senaryo Servis Defteri'ni iş görüşmesinde kısa, tutarlı ve teknik kararlarla birlikte göstermek için hazırlanmıştır.

## Hazırlık

- [Canlı web uygulamasını](https://islik-cloud.vercel.app/) aç.
- [API health](https://islik-cloud-api.onrender.com/health) yanıtını kontrol et.
- Yalnızca kurgusal müşteri bilgileri kullan; gerçek telefon, adres veya fotoğraf yükleme.
- Render cold start nedeniyle API gecikirse beklerken mimariyi anlat; servis hazır değilse yerel akışa geç.

## 0:00–0:30 — Problem

“Küçük servis işletmelerinde müşteri talebi, randevu, iş durumu ve ödeme bilgisi farklı kanallara dağılıyor. Servis Defteri bu akışı müşterinin talep ekranından ustanın operasyon paneline kadar tek üründe topluyor.”

## 0:30–1:15 — Müşteri akışı

1. Kurgusal bir ürün ve arıza açıklaması gir.
2. Fotoğrafların cihazda küçültüldüğünü ve en fazla üç görsel kabul edildiğini belirt.
3. Talep sonucundaki takip kodunu göster.
4. Takip kodu ve telefonla durum geçmişinin nasıl açıldığını anlat.

Vurgu: müşteri hesap açmadan talep oluşturabilir; public takip cevabı hassas adres ve telefon bilgisini döndürmez.

## 1:15–2:10 — Usta akışı

1. Usta panelinde bugün, açık işler ve ödeme durumlarını göster.
2. Bir talebin randevu ve durum akışını aç.
3. Kısmi ödeme sonrası kalan tutarın nasıl hesaplandığını göster.
4. Türkçe karakterli arama ve CSV dışa aktarmayı işaret et.

Vurgu: bütün müşteri ve iş sorguları oturum açan ustaya göre filtrelenir; başka bir hesabın kaydına kimlikle erişim integration testleriyle engellenir.

## 2:10–2:45 — Teknik derinlik

- React/Vite web ve Expo/React Native mobil istemci aynı Express API'yi kullanır.
- PostgreSQL şeması Prisma migration ile yönetilir.
- Mobil token SecureStore'da tutulur; eski AsyncStorage token'ı güvenli alana taşınır.
- API, web, Android ve iOS kontrolleri ayrı GitHub Actions workflow'larında çalışır.
- Production smoke testi health, readiness, güvenlik başlıkları ve CORS reddini aynı komutla doğrular.

## 2:45–3:00 — Kapanış

“Bu projede yalnızca ekran geliştirmedim; veri izolasyonu, mobil dayanıklılık, test, CI ve production dağıtımını birlikte ele aldım.”

## Görüşmede gelebilecek sorular

- Fotoğrafları neden sunucu yerine önce istemcide sıkıştırdın?
- JWT ve kullanıcı bazlı veri izolasyonunu nasıl test ettin?
- Render cold start ve çevrimdışı mobil kullanım için ne yaptın?
- Kısmi ödeme güncellemelerinde tutarlılığı nasıl korudun?
