# Servis Defteri Mobile

Expo ile yazilmis gercek mobil uygulamadir. Mevcut Express API'yi kullanir.

## Yerel Calistirma

```bash
cd apps/mobile
npm install
npm start
```

Masaustundeki `Servis Defteri Mobil Baslat.cmd` dosyasi API ve Expo'yu birlikte baslatir. Fiziksel telefonda `localhost` yerine bilgisayarin Wi-Fi IP adresi kullanilir.

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

Preview ve production paketleri varsayilan olarak `https://islik-cloud-api.onrender.com` API adresini kullanir. Yerel Expo Go gelistirmesinde `.env.local` veya baslatma dosyasinin verdigi LAN adresi kullanilir.
