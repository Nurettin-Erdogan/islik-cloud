# Servis Defteri Web

Servis Defteri, müşteri arıza talebi açma ve usta servis takibi için hazırlanmış React + Vite arayüzüdür.

## Komutlar

```bash
npm run dev
npm run build
npm run lint
```

## PWA

Web arayüzünde PWA manifest, ikonlar, offline sayfası ve service worker kaydı vardır. HTTPS üzerinde yayınlandığında Android Chrome ve iPhone Safari üzerinden ana ekrana eklenebilir.

Local bilgisayarda PWA kaydı `localhost` üzerinde çalışır:

```bash
npm run build
npm run preview
```

Ardından `http://localhost:4173` adresinde manifest ve service worker test edilebilir.

## Mobil cihazdan local test

Aynı Wi-Fi ağındaki telefondan ekranı denemek için API ve web sunucusunu bilgisayar IP adresiyle aç:

```bash
# apps/api
npm run dev

# apps/web
npm run dev -- --host 0.0.0.0
```

Telefon tarayıcısından `http://BILGISAYAR_IP:5173` adresine gir. Web tarafındaki `.env` içinde API adresi de telefonun erişebileceği şekilde ayarlanmalıdır:

```env
VITE_API_URL=http://BILGISAYAR_IP:4000
```

Not: Telefonda gerçek kurulabilir PWA deneyimi için adresin HTTPS olması gerekir. Local IP ile ekranı test edebilirsin; tam kurulum için uygulamayı HTTPS bir adrese deploy etmek gerekir.
