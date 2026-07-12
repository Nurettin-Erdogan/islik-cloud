# Servis Defteri Mobile

Expo ile yazilmis gercek mobil uygulamadir. Mevcut Express API'yi kullanir.

## En Kolay Calistirma

Proje ana klasorundeki `Servis Defteri Mobil Baslat.cmd` dosyasina cift tikla. Baslatici baglantiyi otomatik secer:

- Docker ve PostgreSQL hazirsa hizli yerel API'yi ve bilgisayarin dogru Wi-Fi adresini kullanir.
- Yerel veritabani kapaliysa calisan bulut API'ye gecer.
- API hazir olmadan yerel QR akisini baslatmaz.
- Metro onbellegini korur; sonraki QR acilislari daha hizli olur.

Telefon ve bilgisayar yerel baglanti kullanilirken ayni Wi-Fi aginda olmalidir. Normal kullanimda uygulamaya sunucu adresi yazmak gerekmez.

## QR ve Gunluk Kullanim

Expo QR kodu gelistirme ve hizli test icindir; ilk acilista Metro, iPhone icin JavaScript bundle hazirlar. Gunluk kullanimda `releases` klasorundeki APK'yi kurmak daha hizli ve daha kararlidir. Yeni final surum `1.1.0` olarak paketlenir.

## Elle Calistirma

`apps/mobile` klasorunde:

```bash
npm install
npm start -- --lan
```

Bu yolda `.env.local` yoksa veya yerel adres verilmediyse bulut API kullanilir.

## Kontroller

```bash
npm run doctor
npm run config:check
npm run export:android
```

## APK ve AAB

Ilk kez EAS hesabina gir:

```bash
npx eas-cli login
```

Telefona kurulabilir test APK'si:

```bash
npm run build:apk
```

Google Play icin production AAB:

```bash
npm run build:aab
```

iOS production paketi:

```bash
npm run build:ios
```

Preview ve production paketleri varsayilan olarak `https://islik-cloud-api.onrender.com` API adresini kullanir.
