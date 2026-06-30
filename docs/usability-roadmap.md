# Kullanılabilirlik Geliştirme Yol Haritası

Bu not, İşlik Cloud'u küçük servis işletmeleri için daha hızlı, anlaşılır ve hata toleranslı hale getirmek amacıyla hazırlanmıştır.

## Uygulanan ilk iyileştirme

- Telefon alanı artık sadece rakam kabul eder.
- Müşteri adı ve kayıt ekranındaki ad soyad alanı rakam kabul etmez.
- Aynı kurallar API tarafında da doğrulanır.

## Öncelik 1 - Formları daha güvenli ve rahat yapmak

- Alan bazlı hata mesajları ekle: Hata sadece üstte genel mesaj olarak değil, ilgili alanın altında da görünmeli.
- Telefonu okunabilir göster: Kullanıcı düz rakam girsin, listede `0555 123 45 67` gibi daha rahat okunsun.
- Kaydetme sırasında butonları kilitle: Çift tıklama ile iki kayıt oluşmasını engelle.
- Kayıt başarılı olunca kısa başarı bildirimi göster ve formu yumuşak şekilde sıfırla.

Neden: GOV.UK form rehberi hem client hem server doğrulaması gerektiğini, hataların ilgili alan yanında gösterilmesinin kullanıcıya toparlanma alanı verdiğini vurgular.

## Öncelik 2 - Günlük iş akışını hızlandırmak

- Müşteri kartından doğrudan iş ekleme: Kullanıcı müşteri seçmek zorunda kalmadan o müşteriye iş açabilsin.
- İş durumunu tek tıkla değiştirme: `Bekliyor`, `Devam ediyor`, `Tamamlandı` kontrolleri rozet/menü olarak daha hızlı kullanılmalı.
- Son kullanılan müşteri veya son müşteri araması hatırlanmalı.
- Liste üstünde hızlı işlem sayacı: Bugün randevusu olanlar, gecikenler, tahsilatı bekleyenler.

Neden: Nielsen Norman Group'un sezgisel tasarım ilkelerinde sistem durumunun görünür olması, kullanıcının hafıza yükünün azaltılması ve sık kullanılan işlemlerin hızlandırılması öne çıkar.

## Öncelik 3 - Paneli daha anlaşılır yapmak

- İşleri sekmelere böl: `Açık İşler`, `Bugün`, `Tamamlananlar`, `Ödeme Bekleyenler`.
- Boş durumları aksiyonlu yap: `İlk müşterini ekle` veya `Bu müşteriye iş aç` gibi doğrudan butonlar.
- Kartlarda bilgiyi önceliklendir: Başlık, müşteri, randevu, durum ve fiyat görünür; açıklama gerektiğinde genişlesin.
- Arama sonuçlarını vurgula: Aranan kelime müşteri/iş listesinde belirginleşsin.

## Öncelik 4 - Erişilebilirlik ve mobil kullanım

- Klavye ile tüm iş akışları tamamlanabilmeli.
- Odak çizgileri tüm buton/inputlarda görünür olmalı.
- Mobilde form ve liste sıralaması iş akışına göre düzenlenmeli: önce özet, sonra hızlı arama, sonra kayıtlar.
- Hata ve başarı mesajları ekran okuyucuya uygun `aria-live` alanıyla duyurulmalı.

Neden: W3C WAI, erişilebilirliğin farklı cihazlar, giriş yöntemleri ve kullanıcı yetenekleri için kaliteyi artırdığını belirtir.

## Öncelik 5 - Ürünleşme adımları

- Takvim görünümü ekle.
- Müşteri detay sayfası ekle.
- Kısmi ödeme tutarı ve ödeme geçmişi ekle.
- CSV/Excel dışa aktarma ekle.
- Basit rol yapısı ekle: işletme sahibi, çalışan.
- OpenAPI dokümantasyonu ekle.

## Kaynaklar

- Nielsen Norman Group - 10 Usability Heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/
- GOV.UK Design System - Recover from validation errors: https://design-system.service.gov.uk/patterns/validation/
- W3C WAI - Introduction to Web Accessibility: https://www.w3.org/WAI/fundamentals/accessibility-intro/
