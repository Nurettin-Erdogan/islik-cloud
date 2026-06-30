const statusLabels = {
  pending: "Bekliyor",
  in_progress: "Devam ediyor",
  completed: "Tamamlandı",
  cancelled: "İptal edildi"
};

const paymentStatusLabels = {
  unpaid: "Ödenmedi",
  partial: "Kısmi ödendi",
  paid: "Ödendi"
};

const priorityLabels = {
  low: "Düşük",
  normal: "Normal",
  high: "Yüksek",
  urgent: "Acil"
};

function formatAppointment(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function JobList({ jobs, onEdit, onMarkCompleted, onMarkPaid, onDelete }) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <h2>İşler</h2>
        <span>{jobs.length} kayıt</span>
      </div>

      <div className="list">
        {jobs.length === 0 ? (
          <p className="empty-state">Filtreye uygun iş kaydı yok.</p>
        ) : (
          jobs.map((job) => {
            const appointment = formatAppointment(job.appointmentAt);

            return (
              <div className="list-item" key={job.id}>
                <div className="item-main">
                  <strong>{job.title}</strong>
                  <span>{job.customer?.name || "Müşteri yok"}</span>
                  <div className="job-meta">
                    <span className={`badge status-${job.status}`}>
                      {statusLabels[job.status] || job.status}
                    </span>
                    <span className={`badge payment-${job.paymentStatus}`}>
                      {paymentStatusLabels[job.paymentStatus] || job.paymentStatus}
                    </span>
                    <span className={`badge priority-${job.priority}`}>
                      {priorityLabels[job.priority] || job.priority}
                    </span>
                    <span className="price-chip">
                      {Number(job.price || 0).toLocaleString("tr-TR")} TL
                    </span>
                  </div>
                  {appointment ? <small>Randevu: {appointment}</small> : null}
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
            );
          })
        )}
      </div>
    </article>
  );
}

export default JobList;
