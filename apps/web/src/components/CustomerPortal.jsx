import { useState } from "react";
import { createPublicRequest, getPublicRequest } from "../services/api";

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
  description: ""
};

const initialTrackingForm = {
  requestCode: "",
  phone: ""
};

function CustomerPortal() {
  const [requestForm, setRequestForm] = useState(initialRequestForm);
  const [trackingForm, setTrackingForm] = useState(initialTrackingForm);
  const [createdRequest, setCreatedRequest] = useState(null);
  const [trackedRequest, setTrackedRequest] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tracking, setTracking] = useState(false);

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
      <h1>Arıza Talebi Aç</h1>
      <p className="hero-text">
        Cihazını seç, arızayı yaz, takip kodunla süreci buradan izle.
      </p>

      {message ? <p className="message">{message}</p> : null}

      <form className="auth-form" onSubmit={handleCreateRequest}>
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
            />
          </label>

          <label>
            Model
            <input
              name="productModel"
              value={requestForm.productModel}
              onChange={updateRequestForm}
              placeholder="Opsiyonel"
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
            required
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? "Talep oluşturuluyor..." : "Talep Oluştur"}
        </button>
      </form>

      <form className="tracking-form" onSubmit={handleTrackRequest}>
        <h2>Talep Takibi</h2>
        <div className="form-grid two-columns">
          <label>
            Takip Kodu
            <input
              name="requestCode"
              value={trackingForm.requestCode}
              onChange={updateTrackingForm}
              placeholder="SD-123456"
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
              required
            />
          </label>
        </div>
        <button type="submit" className="secondary-button" disabled={tracking}>
          {tracking ? "Kontrol ediliyor..." : "Durumu Göster"}
        </button>
      </form>

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
        </div>
      ) : null}
    </section>
  );
}

export default CustomerPortal;
