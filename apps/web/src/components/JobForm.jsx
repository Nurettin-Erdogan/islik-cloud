const productCategories = [
  { value: "heating", label: "Kombi / Isıtma" },
  { value: "cooling", label: "Klima / Soğutma" },
  { value: "white_goods", label: "Beyaz eşya" },
  { value: "electronics", label: "Elektronik" },
  { value: "computer", label: "Bilgisayar" },
  { value: "phone", label: "Telefon" },
  { value: "other", label: "Diğer" }
];

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("tr-TR") + " TL";
}

function JobForm({
  form,
  customers,
  editingJobId,
  minAppointmentAt,
  onChange,
  onSubmit,
  onReset
}) {
  const price = Number(form.price || 0);
  const paidAmount =
    form.paymentStatus === "paid"
      ? price
      : form.paymentStatus === "partial"
        ? Number(form.paidAmount || 0)
        : 0;
  const remainingAmount = Math.max(price - paidAmount, 0);
  const shouldShowRemainingAmount =
    form.paymentStatus === "partial" && price > 0 && paidAmount > 0;
  const appointmentMin =
    editingJobId && form.appointmentAt && form.appointmentAt < minAppointmentAt
      ? form.appointmentAt
      : minAppointmentAt;

  return (
    <form className="panel" onSubmit={onSubmit}>
      <h2>{editingJobId ? "Talep Düzenle" : "Talep Oluştur"}</h2>

      <label>
        Müşteri
        <select
          name="customerId"
          value={form.customerId}
          onChange={onChange}
          required
        >
          <option value="">Müşteri seç</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </label>

      <div className="form-grid three-columns">
        <label>
          Ürün
          <select
            name="productCategory"
            value={form.productCategory}
            onChange={onChange}
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
            value={form.productBrand}
            onChange={onChange}
            placeholder="Arçelik"
            maxLength={80}
          />
        </label>

        <label>
          Model
          <input
            name="productModel"
            value={form.productModel}
            onChange={onChange}
            placeholder="Opsiyonel"
            maxLength={80}
          />
        </label>
      </div>

      <label>
        Talep Başlığı
        <input
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="Klima soğutmuyor"
          maxLength={120}
          required
        />
      </label>

      <label>
        Arıza Açıklaması
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          placeholder="Müşterinin belirttiği sorun ve ilk notlar"
          maxLength={2000}
        />
      </label>

      <label>
        Tahmini Ücret
        <input
          name="price"
          type="number"
          min="0"
          max="1000000000"
          step="0.01"
          value={form.price}
          onChange={onChange}
          placeholder="1200"
        />
      </label>

      <label>
        Talep Durumu
        <select name="status" value={form.status} onChange={onChange}>
          <option value="pending">Talep alındı</option>
          <option value="in_progress">İncelemede</option>
          <option value="completed">Tamamlandı</option>
          <option value="cancelled">İptal edildi</option>
        </select>
      </label>

      <label>
        Öncelik
        <select name="priority" value={form.priority} onChange={onChange}>
          <option value="low">Düşük</option>
          <option value="normal">Normal</option>
          <option value="high">Yüksek</option>
          <option value="urgent">Acil</option>
        </select>
      </label>

      <label>
        Randevu
        <input
          name="appointmentAt"
          type="datetime-local"
          min={appointmentMin}
          value={form.appointmentAt}
          onChange={onChange}
        />
      </label>

      <label>
        Ödeme
        <select
          name="paymentStatus"
          value={form.paymentStatus}
          onChange={onChange}
        >
          <option value="unpaid">Ödenmedi</option>
          <option value="partial">Kısmi ödendi</option>
          <option value="paid">Ödendi</option>
        </select>
      </label>

      {form.paymentStatus === "partial" ? (
        <label>
          Ödenen Tutar
          <input
            name="paidAmount"
            type="number"
            min="0"
            max={form.price || 1000000000}
            step="0.01"
            value={form.paidAmount}
            onChange={onChange}
            placeholder="500"
            required
          />
        </label>
      ) : null}

      {shouldShowRemainingAmount ? (
        <small className="payment-summary">
          Kalan: {formatCurrency(remainingAmount)}
        </small>
      ) : null}

      <div className="form-actions">
        <button type="submit" disabled={customers.length === 0}>
          {editingJobId ? "Talebi Güncelle" : "Talep Kaydet"}
        </button>

        {editingJobId ? (
          <button type="button" className="secondary-button" onClick={onReset}>
            Vazgeç
          </button>
        ) : null}
      </div>

      {customers.length === 0 ? (
        <small>Talep eklemek için önce müşteri oluştur.</small>
      ) : null}
    </form>
  );
}

export default JobForm;
