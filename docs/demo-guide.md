# 3 dakikalık demo

Servis Defteri’ni kısa bir ürün turunda göstermek için hazırlanmış akış. Amaç özellik listesi okumak değil; müşteri talebinden usta operasyonuna kadar aynı kaydın nasıl izolasyon, ödeme ve dağıtım kararlarıyla taşındığını anlatmak.

## Hazırlık

- [Canlı web](https://islik-cloud.vercel.app/) ve [API health](https://islik-cloud-api.onrender.com/health) açık olsun.
- Yalnızca kurgusal müşteri bilgisi kullanın; gerçek telefon, adres veya fotoğraf yüklemeyin.
- Render ücretsiz planda uykuya geçebilir. İlk istek gecikirse beklerken mimariyi özetleyin; servis açılmazsa yerel kurulumla devam edin.

## 0:00–0:30 — Problem

Küçük servis işletmelerinde talep, randevu, iş durumu ve tahsilat çoğu zaman WhatsApp, defter ve Excel arasında dağılır. Servis Defteri bu kaydı tek üründe tutar: müşteri hesap açmadan talep oluşturur, usta aynı kaydı randevu, durum ve ödeme ile yönetir.

## 0:30–1:15 — Müşteri

1. Kurgusal ürün ve arıza açıklaması girin.
2. Fotoğrafların yüklemeden önce cihazda sıkıştırıldığını, en fazla üç görsel kabul edildiğini belirtin.
3. Oluşan takip kodunu gösterin.
4. Kod ve telefonla durum geçmişinin nasıl açıldığını gösterin.

Public takip yanıtı adres ve tam telefon döndürmez. Kimliği doğrulanmamış uç, operasyon detayını sızdırmaz.

## 1:15–2:10 — Usta

1. Bugün, açık işler ve ödeme panolarını açın.
2. Bir talebin randevu ve durum geçmişini gösterin.
3. Kısmi ödemede kalan tutarın sunucuda hesaplandığını gösterin.
4. Türkçe karakterli arama ve CSV dışa aktarmayı işaret edin.

Müşteri ve iş sorguları oturumdaki ustaya göre süzülür. Başka hesabın kaydına kimlik ile erişim, entegrasyon testleriyle reddedilir.

## 2:10–2:45 — Mimari kararlar

Web (React/Vite) ve mobil (Expo) aynı Express API’yi kullanır; iş kuralı istemciye dağılmaz. Şema Prisma migration ile sürülür. Mobil oturum `SecureStore` üzerindedir; eski `AsyncStorage` jetonu ilk açılışta güvenli alana taşınır.

API, web, Android ve iOS ayrı GitHub Actions işlerinde koşar. Üretim duman testi `/health`, `/ready`, güvenlik başlıkları ve CORS reddini aynı komutla doğrular. Böylece “çalışıyor” iddiası tek bir mutlu yola bağlı kalmaz.

## 2:45–3:00 — Kapanış

Servis Defteri, küçük bir operasyon ürününü uçtan uca ele alır: tenant izolasyonu, mobil oturum, istemci tarafı görsel sınırı, ödeme tutarlılığı ve üretim doğrulaması aynı kayıt etrafında durur.

## Olası sorular

**Fotoğrafları neden önce istemcide sıkıştırıyorsunuz?**  
Render ve tarayıcı yükleme sınırını aşmamak için. Üç görsel, sıkıştırılmış `dataUrl` ve istek boyutu API’de yeniden doğrulanır; sıkıştırma yalnızca güven varsayımı değildir.

**JWT ve kullanıcı izolasyonunu nasıl doğruluyorsunuz?**  
Entegrasyon testleri başka kullanıcının `jobId` / müşteri kimliğiyle GET–PUT–DELETE dener ve 404/403 bekler. Yetki, sorguda `userId` süzgeciyle uygulanır; yalnızca arayüz gizlemesine dayanılmaz.

**Cold start ve çevrimdışı mobil için ne yaptınız?**  
İstemci warmup, uzun zaman aşımı ve yavaş-yol metni kullanır. Mobil listeler SecureStore önbelleğinden açılır; LAN API adresi algılanır, kopunca yeniden denenir.

**Kısmi ödemede tutar nasıl tutarlı kalır?**  
`paidAmount`, fiyatı aşamaz; kalan tutar istemci tahmini değil sunucu kuralıdır. Geçersiz geçişler 400 ile reddedilir.
