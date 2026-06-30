function StatsGrid({ customerCount, jobCount, pendingJobs, totalRevenue }) {
  return (
    <section className="stats-grid" aria-label="Özet istatistikler">
      <article className="stat-card stat-card-blue">
        <span>Müşteri</span>
        <strong>{customerCount}</strong>
        <small>Kayıtlı kişi</small>
      </article>

      <article className="stat-card stat-card-green">
        <span>İş Kaydı</span>
        <strong>{jobCount}</strong>
        <small>Toplam servis</small>
      </article>

      <article className="stat-card stat-card-amber">
        <span>Bekleyen İş</span>
        <strong>{pendingJobs}</strong>
        <small>Açık takip</small>
      </article>

      <article className="stat-card stat-card-slate">
        <span>Ödenmiş Gelir</span>
        <strong>{totalRevenue.toLocaleString("tr-TR")} TL</strong>
        <small>Tamamlanan tahsilat</small>
      </article>
    </section>
  );
}

export default StatsGrid;
