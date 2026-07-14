function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("0")) {
    return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 9), digits.slice(9)].join(" ");
  }

  if (digits.length === 10) {
    return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8)].join(" ");
  }

  if (digits.length === 12 && digits.startsWith("90")) {
    return "+90 " + [digits.slice(2, 5), digits.slice(5, 8), digits.slice(8, 10), digits.slice(10)].join(" ");
  }

  return String(value || "");
}

function CustomerList({ customers, onEdit, onCreateJob, onDelete }) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <h2>Müşteriler</h2>
        <span>{customers.length} kayıt</span>
      </div>

      <div className="list">
        {customers.length === 0 ? (
          <p className="empty-state">Filtreye uygun müşteri yok.</p>
        ) : (
          customers.map((customer) => (
            <div className="list-item" key={customer.id}>
              <div className="item-main">
                <strong>{customer.name}</strong>
                {customer.phone ? (
                  <a className="customer-phone" href={`tel:${customer.phone}`}>
                    {formatPhone(customer.phone)}
                  </a>
                ) : (
                  <span>Telefon yok</span>
                )}
                <small>{customer.address || "Adres yok"}</small>
              </div>

              <div className="list-actions">
                {onCreateJob ? (
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => onCreateJob(customer)}
                  >
                    Talep Aç
                  </button>
                ) : null}

                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onEdit(customer)}
                >
                  Düzenle
                </button>

                <button
                  type="button"
                  className="danger-button"
                  onClick={() => onDelete(customer)}
                >
                  Sil
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

export default CustomerList;
