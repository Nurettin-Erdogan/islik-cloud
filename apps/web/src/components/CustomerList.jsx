function CustomerList({ customers, onEdit, onDelete }) {
  return (
    <article className="panel">
      <h2>Müşteriler</h2>

      <div className="list">
        {customers.length === 0 ? (
          <p>Filtreye uygun müşteri yok.</p>
        ) : (
          customers.map((customer) => (
            <div className="list-item" key={customer.id}>
              <div>
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
