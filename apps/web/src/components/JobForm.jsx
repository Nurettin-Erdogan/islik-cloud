function JobForm({
  form,
  customers,
  editingJobId,
  onChange,
  onSubmit,
  onReset
}) {
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
