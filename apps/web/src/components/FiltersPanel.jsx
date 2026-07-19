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
        <h2>Talep Arama</h2>
        <button type="button" className="secondary-button" onClick={onResetFilters}>
          <X size={16} aria-hidden="true" />
          Temizle
        </button>
      </div>

      <div className="filter-grid">
        <label className="search-field">
          Müşteri
          <span className="input-with-icon">
            <Search size={18} aria-hidden="true" />
            <input
              value={customerSearch}
              onChange={(event) => onCustomerSearchChange(event.target.value)}
              placeholder="Ad, telefon, adres veya not ara"
            />
          </span>
        </label>

        <label className="search-field">
          Talep
          <span className="input-with-icon">
            <Search size={18} aria-hidden="true" />
            <input
              value={jobSearch}
              onChange={(event) => onJobSearchChange(event.target.value)}
              placeholder="Takip kodu, ürün, arıza veya müşteri ara"
            />
          </span>
        </label>

        <label>
          Talep Durumu
          <select
            value={jobStatusFilter}
            onChange={(event) => onJobStatusFilterChange(event.target.value)}
          >
            <option value="all">Tüm durumlar</option>
            <option value="pending">Talep alındı</option>
            <option value="in_progress">İncelemede</option>
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
        <span>{filteredJobCount} talep</span>
      </div>
    </section>
  );
}

export default FiltersPanel;
import { Search, X } from "lucide-react";
