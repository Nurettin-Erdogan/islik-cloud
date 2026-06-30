function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("tr-TR")} TL`;
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

  return (
    <form className="panel" onSubmit={onSubmit}>
      <h2>{editingJobId ? "İş Kaydı Düzenle" : "İş Kaydı Ekle"}</h2>

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

      <label>
        İş Başlığı
        <input
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="Klima bakımı"
          required
        />
      </label>

      <label>
        Açıklama
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          placeholder="Yıllık servis kontrolü"
        />
      </label>

      <label>
        Fiyat
        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={onChange}
          placeholder="1200"
        />
      </label>

      <label>
        Durum
        <select name="status" value={form.status} onChange={onChange}>
          <option value="pending">Bekliyor</option>
          <option value="in_progress">Devam ediyor</option>
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
          min={minAppointmentAt}
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
            max={form.price || undefined}
            step="0.01"
            value={form.paidAmount}
            onChange={onChange}
            placeholder="500"
            required
          />
        </label>
      ) : null}

      {price > 0 ? (
        <small className="payment-summary">
          Ödenen: {formatCurrency(paidAmount)} · Kalan: {formatCurrency(remainingAmount)}
        </small>
      ) : null}

      <div className="form-actions">
        <button type="submit" disabled={customers.length === 0}>
          {editingJobId ? "İşi Güncelle" : "İş Kaydet"}
        </button>

        {editingJobId ? (
          <button type="button" className="secondary-button" onClick={onReset}>
            Vazgeç
          </button>
        ) : null}
      </div>

      {customers.length === 0 ? (
        <small>İş eklemek için önce müşteri oluştur.</small>
      ) : null}
    </form>
  );
}

export default JobForm;
