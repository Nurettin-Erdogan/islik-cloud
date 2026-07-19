import { useState } from "react";
import { Camera, ClipboardPlus, Search } from "lucide-react";
import { createPublicRequest, getPublicRequest } from "../services/api";
import { compressImageFile } from "../imageUtils";

const MAX_PHOTOS = 3;

const productCategories = [
  { value: "heating", label: "Kombi / Isıtma" },
  { value: "cooling", label: "Klima / Soğutma" },
  { value: "white_goods", label: "Beyaz eşya" },
  { value: "electronics", label: "Elektronik" },
  { value: "computer", label: "Bilgisayar" },
  { value: "phone", label: "Telefon" },
  { value: "other", label: "Diğer" }
];

const statusLabels = {
  pending: "Talep alındı",
  in_progress: "İncelemede",
  completed: "Tamamlandı",
  cancelled: "İptal edildi"
};

const initialRequestForm = {
  name: "",
  phone: "",
  address: "",
  productCategory: "heating",
  productBrand: "",
  productModel: "",
  description: "",
  photos: []
};

const initialTrackingForm = {
  requestCode: "",
  phone: ""
};

function CustomerPortal() {
  const [portalMode, setPortalMode] = useState("create");
  const [requestForm, setRequestForm] = useState(initialRequestForm);
  const [trackingForm, setTrackingForm] = useState(initialTrackingForm);
  const [createdRequest, setCreatedRequest] = useState(null);
  const [trackedRequest, setTrackedRequest] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  function updateRequestForm(event) {
    const { name, value } = event.target;
    const nextValue =
      name === "phone"
        ? value.replace(/\D/g, "")
        : name === "name"
          ? value.replace(/\d/g, "")
          : value;

    setRequestForm((current) => ({
      ...current,
      [name]: nextValue
    }));
  }

  function updateTrackingForm(event) {
    const { name, value } = event.target;
    const nextValue = name === "phone" ? value.replace(/\D/g, "") : value.toUpperCase();

    setTrackingForm((current) => ({
      ...current,
      [name]: nextValue
    }));
  }

  async function handlePhotoSelection(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (files.length === 0 || photoBusy) {
      return;
    }

    const currentPhotos = Array.isArray(requestForm.photos) ? requestForm.photos : [];
    const remainingSlots = MAX_PHOTOS - currentPhotos.length;

    if (remainingSlots <= 0) {
      setMessage("Hata: En fazla 3 fotoğraf ekleyebilirsin.");
      return;
    }

    try {
      setPhotoBusy(true);
      setMessage("");
      const compressedPhotos = [];

      for (const file of files.slice(0, remainingSlots)) {
        compressedPhotos.push(await compressImageFile(file));
      }

      setRequestForm((current) => ({
        ...current,
        photos: [...(current.photos || []), ...compressedPhotos].slice(0, MAX_PHOTOS)
      }));

      if (files.length > remainingSlots) {
        setMessage("En fazla 3 fotoğraf eklendi.");
      }
    } catch (error) {
      setMessage("Hata: " + error.message);
    } finally {
      setPhotoBusy(false);
    }
  }

  function removePhoto(photoId) {
    setRequestForm((current) => ({
      ...current,
      photos: (current.photos || []).filter((photo) => photo.id !== photoId)
    }));
  }

  async function handleCreateRequest(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      const response = await createPublicRequest(requestForm);
      setCreatedRequest(response.data);
      setTrackedRequest(null);
      setPortalMode("track");
      setTrackingForm({
        requestCode: response.data.requestCode,
        phone: requestForm.phone
      });
      setRequestForm(initialRequestForm);
    } catch (error) {
      setMessage("Hata: " + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTrackRequest(event) {
    event.preventDefault();

    if (tracking) {
      return;
    }

    try {
      setTracking(true);
      setMessage("");
      const response = await getPublicRequest(
        trackingForm.requestCode.trim(),
        trackingForm.phone
      );
      setTrackedRequest(response.data);
      setCreatedRequest(null);
    } catch (error) {
      setMessage("Hata: " + error.message);
    } finally {
      setTracking(false);
    }
  }

  const result = createdRequest || trackedRequest;

  return (
    <section className="auth-card customer-portal">
      <p className="eyebrow">Müşteri Alanı</p>
      <h1>{portalMode === "create" ? "Arıza Talebi Aç" : "Talebini Takip Et"}</h1>
      <p className="hero-text">
        {portalMode === "create"
          ? "Cihazını seç, arızayı anlat ve servis talebini oluştur."
          : "Takip kodunla servis sürecini ve randevu durumunu görüntüle."}
      </p>

      <div className="portal-mode-switch" role="tablist" aria-label="Müşteri işlemleri">
        <button
          type="button"
          role="tab"
          aria-selected={portalMode === "create"}
          className={portalMode === "create" ? "is-active" : ""}
          onClick={() => setPortalMode("create")}
        >
          <ClipboardPlus size={18} aria-hidden="true" />
          Yeni Talep
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={portalMode === "track"}
          className={portalMode === "track" ? "is-active" : ""}
          onClick={() => setPortalMode("track")}
        >
          <Search size={18} aria-hidden="true" />
          Talep Takibi
        </button>
      </div>

      {message ? (
        <p className="message" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}

      {portalMode === "create" ? (
      <form className="auth-form portal-request-form" onSubmit={handleCreateRequest}>
        <div className="form-grid two-columns">
          <label>
            Ad Soyad
            <input
              name="name"
              value={requestForm.name}
              onChange={updateRequestForm}
              placeholder="Ahmet Yılmaz"
              autoComplete="name"
              pattern="[^0-9]*"
              maxLength={80}
              required
            />
          </label>

          <label>
            Telefon
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              value={requestForm.phone}
              onChange={updateRequestForm}
              placeholder="05551234567"
              autoComplete="tel"
              pattern="[0-9]*"
              minLength={10}
              maxLength={15}
              required
            />
          </label>
        </div>

        <label>
          Adres
          <input
            name="address"
            value={requestForm.address}
            onChange={updateRequestForm}
            placeholder="Mahalle, sokak, ilçe"
            maxLength={250}
          />
        </label>

        <div className="form-grid three-columns">
          <label>
            Ürün
            <select
              name="productCategory"
              value={requestForm.productCategory}
              onChange={updateRequestForm}
            >
              {productCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Marka
            <input
              name="productBrand"
              value={requestForm.productBrand}
              onChange={updateRequestForm}
              placeholder="Arçelik"
              maxLength={80}
            />
          </label>

          <label>
            Model
            <input
              name="productModel"
              value={requestForm.productModel}
              onChange={updateRequestForm}
              placeholder="Opsiyonel"
              maxLength={80}
            />
          </label>
        </div>

        <label>
          Arıza Açıklaması
          <textarea
            name="description"
            value={requestForm.description}
            onChange={updateRequestForm}
            placeholder="Cihazda ne sorun var? Ne zamandır devam ediyor?"
            minLength="10"
            maxLength={2000}
            required
          />
        </label>

        <div className="portal-photo-picker">
          <div className="portal-photo-header">
            <strong>Fotoğraflar</strong>
            <span>{requestForm.photos.length}/{MAX_PHOTOS}</span>
          </div>
          <input
            id="customer-request-photos"
            className="portal-photo-input"
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelection}
            disabled={photoBusy || requestForm.photos.length >= MAX_PHOTOS}
          />
          <label
            className={`portal-photo-button ${
              photoBusy || requestForm.photos.length >= MAX_PHOTOS ? "is-disabled" : ""
            }`}
            htmlFor="customer-request-photos"
          >
            <Camera size={18} aria-hidden="true" />
            {photoBusy ? "Fotoğraflar hazırlanıyor..." : "Fotoğraf Ekle"}
          </label>
          {requestForm.photos.length > 0 ? (
            <div className="portal-photo-grid">
              {requestForm.photos.map((photo, index) => (
                <div className="portal-photo-item" key={photo.id}>
                  <img
                    className="portal-photo-image"
                    src={photo.dataUrl}
                    alt={`Arıza fotoğrafı ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="portal-photo-remove"
                    onClick={() => removePhoto(photo.id)}
                    aria-label={`Fotoğraf ${index + 1} kaldır`}
                  >
                    Kaldır
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <button type="submit" disabled={submitting || photoBusy}>
          {submitting ? "Talep oluşturuluyor..." : "Talep Oluştur"}
        </button>
      </form>
      ) : null}

      {portalMode === "track" ? (
      <form className="tracking-form" onSubmit={handleTrackRequest}>
        <p className="tracking-help">Takip kodunu ve talebi açarken kullandığın telefonu gir.</p>
        <div className="form-grid two-columns">
          <label>
            Takip Kodu
            <input
              name="requestCode"
              value={trackingForm.requestCode}
              onChange={updateTrackingForm}
              placeholder="SD-123456"
              maxLength={20}
              required
            />
          </label>

          <label>
            Telefon
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              value={trackingForm.phone}
              onChange={updateTrackingForm}
              placeholder="05551234567"
              pattern="[0-9]*"
              minLength={10}
              maxLength={15}
              autoComplete="tel"
              required
            />
          </label>
        </div>
        <button type="submit" className="secondary-button" disabled={tracking}>
          <Search size={18} aria-hidden="true" />
          {tracking ? "Kontrol ediliyor..." : "Durumu Göster"}
        </button>
      </form>
      ) : null}

      {result ? (
        <div className="portal-result">
          <strong>Takip Kodu: {result.requestCode}</strong>
          <span>{result.productCategoryLabel}</span>
          <span>Durum: {statusLabels[result.status] || result.status}</span>
          {result.appointmentAt ? (
            <span>
              Randevu: {new Date(result.appointmentAt).toLocaleString("tr-TR")}
            </span>
          ) : (
            <span>Randevu bilgisi usta tarafından eklenecek.</span>
          )}
          {Array.isArray(result.photos) && result.photos.length > 0 ? (
            <div className="portal-result-photos">
              {result.photos.map((photo, index) => (
                <img
                  key={photo.id || index}
                  src={photo.dataUrl}
                  alt={`Talep fotoğrafı ${index + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default CustomerPortal;
