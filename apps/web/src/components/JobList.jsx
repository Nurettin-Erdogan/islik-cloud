const statusLabels = {
  pending: "Talep alındı",
  in_progress: "İncelemede",
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

const productCategoryLabels = {
  heating: "Kombi / Isıtma",
  cooling: "Klima / Soğutma",
  white_goods: "Beyaz eşya",
  electronics: "Elektronik",
  computer: "Bilgisayar",
  phone: "Telefon",
  other: "Diğer"
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

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("tr-TR") + " TL";
}

function getRemainingAmount(job) {
  const price = Number(job.price || 0);

  if (job.paymentStatus === "paid") {
    return 0;
  }

  if (job.paymentStatus === "partial") {
    const paidAmount = Math.min(Number(job.paidAmount || 0), price);
    return Math.max(price - paidAmount, 0);
  }

  return price;
}

function getProductLine(job) {
  const category = productCategoryLabels[job.productCategory] || productCategoryLabels.other;
  const brandModel = [job.productBrand, job.productModel].filter(Boolean).join(" ");
  return brandModel ? category + " - " + brandModel : category;
}

function isOverdue(job) {
  if (!job.appointmentAt || job.status === "completed" || job.status === "cancelled") {
    return false;
  }

  return new Date(job.appointmentAt) < new Date();
}

function JobList({
  jobs,
  title = "Talepler",
  emptyMessage = "Filtreye uygun talep yok.",
  onEdit,
  onMarkCompleted,
  onMarkPaid,
  onDelete
}) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        <span>{jobs.length} kayıt</span>
      </div>

      <div className="list">
        {jobs.length === 0 ? (
          <p className="empty-state">{emptyMessage}</p>
        ) : (
          jobs.map((job) => {
            const appointment = formatAppointment(job.appointmentAt);
            const remainingAmount = getRemainingAmount(job);
            const price = Number(job.price || 0);
            const hasPartialPayment =
              job.paymentStatus === "partial" && price > 0 && Number(job.paidAmount || 0) > 0;
            const overdue = isOverdue(job);

            return (
              <div className={`list-item ${overdue ? "is-overdue" : ""}`} key={job.id}>
                <div className="item-main">
                  <strong>{job.title}</strong>
                  <span>{job.customer?.name || "Müşteri yok"}</span>
                  <small>{getProductLine(job)}</small>
                  <div className="job-meta">
                    {job.requestCode ? (
                      <span className="badge request-code">{job.requestCode}</span>
                    ) : null}
                    {job.source === "customer" ? (
                      <span className="badge source-customer">Müşteri talebi</span>
                    ) : null}
                    {overdue ? <span className="badge status-cancelled">Gecikti</span> : null}
                    <span className={"badge status-" + job.status}>
                      {statusLabels[job.status] || job.status}
                    </span>
                    <span className={"badge payment-" + job.paymentStatus}>
                      {paymentStatusLabels[job.paymentStatus] || job.paymentStatus}
                    </span>
                    <span className={"badge priority-" + job.priority}>
                      {priorityLabels[job.priority] || job.priority}
                    </span>
                    <span className="price-chip">Toplam: {formatCurrency(price)}</span>
                  </div>
                  {hasPartialPayment ? (
                    <small className="payment-detail">
                      Kalan: {formatCurrency(remainingAmount)}
                    </small>
                  ) : null}
                  {appointment ? <small>Randevu: {appointment}</small> : null}
                </div>

                <div className="list-actions">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => onEdit(job)}
                  >
                    <Pencil size={16} aria-hidden="true" />
                    Düzenle
                  </button>

                  <button
                    type="button"
                    className="ghost-button"
                    disabled={job.status === "completed"}
                    onClick={() => onMarkCompleted(job)}
                  >
                    <BadgeCheck size={16} aria-hidden="true" />
                    Tamamlandı
                  </button>

                  <button
                    type="button"
                    className="ghost-button"
                    disabled={job.paymentStatus === "paid"}
                    onClick={() => onMarkPaid(job)}
                  >
                    <Banknote size={16} aria-hidden="true" />
                    Ödendi
                  </button>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => onDelete(job)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
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
import { BadgeCheck, Banknote, Pencil, Trash2 } from "lucide-react";
