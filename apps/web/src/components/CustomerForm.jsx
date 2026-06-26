function CustomerForm({
  form,
  editingCustomerId,
  onChange,
  onSubmit,
  onReset
}) {
  return (
    <form className="panel" onSubmit={onSubmit}>
      <h2>{editingCustomerId ? "Müşteri Düzenle" : "Müşteri Ekle"}</h2>

      <label>
        Ad Soyad
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="Ahmet Yılmaz"
          required
        />
      </label>

      <label>
        Telefon
        <input
          name="phone"
          value={form.phone}
          onChange={onChange}
          placeholder="05551234567"
        />
      </label>

      <label>
        Adres
        <input
          name="address"
          value={form.address}
          onChange={onChange}
          placeholder="İstanbul"
        />
      </label>

      <label>
        Not
        <textarea
          name="note"
          value={form.note}
          onChange={onChange}
          placeholder="Müşteri notu"
        />
      </label>

      <div className="form-actions">
        <button type="submit">
          {editingCustomerId ? "Müşteriyi Güncelle" : "Müşteri Kaydet"}
        </button>

        {editingCustomerId ? (
          <button type="button" className="secondary-button" onClick={onReset}>
            Vazgeç
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default CustomerForm;
