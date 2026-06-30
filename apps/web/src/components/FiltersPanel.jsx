function FiltersPanel({
  customerSearch,
  jobSearch,
  jobStatusFilter,
  paymentStatusFilter,
  filteredCustomerCount,
  filteredJobCount,
  onCustomerSearchChange,
  onJobSearchChange,
  onJobStatusFilterChange,
  onPaymentStatusFilterChange,
  onResetFilters
}) {
  return (
    <section className="panel filter-panel">
      <div className="panel-heading">
        <h2>Arama</h2>
        <button type="button" className="secondary-button" onClick={onResetFilters}>
          Temizle
        </button>
      </div>

      <div className="filter-grid">
        <label>
          Müşteri
          <input
            value={customerSearch}
            onChange={(event) => onCustomerSearchChange(event.target.value)}
            placeholder="İsim yaz, bağlı işler de gelsin"
          />
        </label>

        <label>
          İş
          <input
            value={jobSearch}
            onChange={(event) => onJobSearchChange(event.target.value)}
            placeholder="Başlık, açıklama veya müşteri ara"
          />
        </label>

        <label>
          İş Durumu
          <select
            value={jobStatusFilter}
            onChange={(event) => onJobStatusFilterChange(event.target.value)}
          >
            <option value="all">Tüm durumlar</option>
            <option value="pending">Bekliyor</option>
            <option value="in_progress">Devam ediyor</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal edildi</option>
          </select>
        </label>

        <label>
          Ödeme Durumu
          <select
            value={paymentStatusFilter}
            onChange={(event) => onPaymentStatusFilterChange(event.target.value)}
          >
            <option value="all">Tüm ödemeler</option>
            <option value="unpaid">Ödenmedi</option>
            <option value="partial">Kısmi ödendi</option>
            <option value="paid">Ödendi</option>
          </select>
        </label>
      </div>

      <div className="filter-summary">
        <span>{filteredCustomerCount} müşteri</span>
        <span>{filteredJobCount} iş</span>
      </div>
    </section>
  );
}

export default FiltersPanel;
