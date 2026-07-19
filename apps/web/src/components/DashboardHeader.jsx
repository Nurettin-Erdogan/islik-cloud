import { ClipboardPlus, UserPlus } from "lucide-react";

function DashboardHeader({ eyebrow, title, description, onAddCustomer, onAddJob }) {
  return (
    <header className="dashboard-header">
      <div className="page-title">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="header-actions" aria-label="Hızlı işlemler">
        <button type="button" className="secondary-button" onClick={onAddCustomer}>
          <UserPlus size={18} aria-hidden="true" />
          Müşteri Ekle
        </button>
        <button type="button" onClick={onAddJob}>
          <ClipboardPlus size={18} aria-hidden="true" />
          Talep Aç
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;
