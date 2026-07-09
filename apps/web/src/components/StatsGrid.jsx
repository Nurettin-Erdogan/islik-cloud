function StatsGrid({ customerCount, jobCount, pendingJobs, totalRevenue }) {
  return (
    <section className="stats-grid" aria-label="Özet istatistikler">
      <article className="stat-card stat-card-blue">
        <span>Müşteri</span>
        <strong>{customerCount}</strong>
        <small>Kayıtlı kişi</small>
      </article>

      <article className="stat-card stat-card-green">
        <span>Talep</span>
        <strong>{jobCount}</strong>
        <small>Toplam arıza kaydı</small>
      </article>

      <article className="stat-card stat-card-amber">
        <span>Açık Talep</span>
        <strong>{pendingJobs}</strong>
        <small>Usta takibinde</small>
      </article>

      <article className="stat-card stat-card-slate">
        <span>Tahsilat</span>
        <strong>{totalRevenue.toLocaleString("tr-TR")} TL</strong>
        <small>Ödenmiş servis geliri</small>
      </article>
    </section>
  );
}

export default StatsGrid;
