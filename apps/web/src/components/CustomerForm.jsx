function CustomerForm({
  form,
  editingCustomerId,
  onChange,
  onSubmit,
  onReset
}) {
  function updateName(event) {
    onChange({
      target: {
        name: event.target.name,
        value: event.target.value.replace(/\d/g, "")
      }
    });
  }

  function updatePhone(event) {
    onChange({
      target: {
        name: event.target.name,
        value: event.target.value.replace(/\D/g, "")
      }
    });
  }

  return (
    <form className="panel" onSubmit={onSubmit}>
      <h2>{editingCustomerId ? "Müşteri Düzenle" : "Müşteri Ekle"}</h2>

      <label>
        Ad Soyad
        <input
          name="name"
          value={form.name}
          onChange={updateName}
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
          value={form.phone}
          onChange={updatePhone}
          placeholder="05551234567"
          autoComplete="tel"
          pattern="[0-9]*"
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
