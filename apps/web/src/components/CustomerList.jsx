function CustomerList({ customers, onEdit, onDelete }) {
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
                <span>{customer.phone || "Telefon yok"}</span>
                <small>{customer.address || "Adres yok"}</small>
              </div>

              <div className="list-actions">
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
