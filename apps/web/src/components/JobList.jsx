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
      <h2>İşler</h2>

      <div className="list">
        {jobs.length === 0 ? (
          <p>Filtreye uygun iş kaydı yok.</p>
        ) : (
          jobs.map((job) => {
            const appointment = formatAppointment(job.appointmentAt);

            return (
              <div className="list-item" key={job.id}>
                <div>
                  <strong>{job.title}</strong>
                  <span>{job.customer?.name || "Müşteri yok"}</span>
                  <small>
                    {statusLabels[job.status] || job.status} ·{" "}
                    {paymentStatusLabels[job.paymentStatus] || job.paymentStatus} ·{" "}
                    {priorityLabels[job.priority] || job.priority} ·{" "}
                    {Number(job.price || 0).toLocaleString("tr-TR")} TL
                  </small>
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
