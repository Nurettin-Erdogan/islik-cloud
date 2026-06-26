function JobList({ jobs, onEdit, onMarkCompleted, onMarkPaid, onDelete }) {
  return (
    <article className="panel">
      <h2>İşler</h2>

      <div className="list">
        {jobs.length === 0 ? (
          <p>Filtreye uygun iş kaydı yok.</p>
        ) : (
          jobs.map((job) => (
            <div className="list-item" key={job.id}>
              <div>
                <strong>{job.title}</strong>
                <span>{job.customer?.name || "Müşteri yok"}</span>
                <small>
                  {job.status} · {job.paymentStatus} ·{" "}
                  {Number(job.price || 0).toLocaleString("tr-TR")} TL
                </small>
              </div>

              <div className="list-actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onEdit(job)}
                >
                  Düzenle
                </button>

                <button
                  type="button"
                  className="ghost-button"
                  disabled={job.status === "completed"}
                  onClick={() => onMarkCompleted(job)}
                >
                  Tamamlandı
                </button>

                <button
                  type="button"
                  className="ghost-button"
                  disabled={job.paymentStatus === "paid"}
                  onClick={() => onMarkPaid(job)}
                >
                  Ödendi
                </button>

                <button
                  type="button"
                  className="danger-button"
                  onClick={() => onDelete(job)}
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

export default JobList;
