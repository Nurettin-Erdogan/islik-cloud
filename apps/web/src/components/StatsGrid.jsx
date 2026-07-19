import { Banknote, ClipboardList, Clock3, Users } from "lucide-react";

function StatsGrid({ customerCount, jobCount, pendingJobs, totalRevenue }) {
  return (
    <section className="stats-grid" aria-label="Özet istatistikler">
      <article className="stat-card stat-card-blue">
        <div className="stat-card-heading"><span>Müşteri</span><Users size={19} aria-hidden="true" /></div>
        <strong>{customerCount}</strong>
        <small>Kayıtlı kişi</small>
      </article>

      <article className="stat-card stat-card-green">
        <div className="stat-card-heading"><span>Talep</span><ClipboardList size={19} aria-hidden="true" /></div>
        <strong>{jobCount}</strong>
        <small>Toplam arıza kaydı</small>
      </article>

      <article className="stat-card stat-card-amber">
        <div className="stat-card-heading"><span>Açık Talep</span><Clock3 size={19} aria-hidden="true" /></div>
        <strong>{pendingJobs}</strong>
        <small>Usta takibinde</small>
      </article>

      <article className="stat-card stat-card-slate">
        <div className="stat-card-heading"><span>Tahsilat</span><Banknote size={19} aria-hidden="true" /></div>
        <strong>{totalRevenue.toLocaleString("tr-TR")} TL</strong>
        <small>Ödenmiş servis geliri</small>
      </article>
    </section>
  );
}

export default StatsGrid;
