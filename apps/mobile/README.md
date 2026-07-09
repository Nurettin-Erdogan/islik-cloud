# Servis Defteri Mobile

Expo ile yazilmis gercek mobil frontend. Backend olarak mevcut Express API kullanilir.

## Kurulum

```bash
cd apps/mobile
npm install
```

## Calistirma

Masaustundeki `Servis Defteri Mobil Baslat.cmd` dosyasini ac. API ve Expo birlikte baslar. Bu dosya bilgisayarin Wi-Fi IP adresini bulup Expo'ya `EXPO_PUBLIC_API_URL` olarak verir.

Telefonla Expo Go QR kodunu okutunca uygulama bilgisayarin LAN IP adresini otomatik yakalamaya calisir.

Fiziksel telefonda API adresi olarak `localhost` kullanilmaz. Dogru format:

```text
http://BILGISAYAR_IP:4000
```

Uygulamadaki Sunucu kartinda `LAN IP ile Doldur` ve `Test Et` butonlari var. Test basariliysa usta girisi ve musteri talebi calisir.
