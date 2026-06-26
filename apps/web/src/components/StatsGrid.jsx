function StatsGrid({ customerCount, jobCount, pendingJobs, totalRevenue }) {
  return (
    <section className="stats-grid">
      <article className="stat-card">
        <span>Müşteri</span>
        <strong>{customerCount}</strong>
      </article>

      <article className="stat-card">
        <span>İş Kaydı</span>
        <strong>{jobCount}</strong>
      </article>

      <article className="stat-card">
        <span>Bekleyen İş</span>
        <strong>{pendingJobs}</strong>
      </article>

      <article className="stat-card">
        <span>Ödenmiş Gelir</span>
        <strong>{totalRevenue.toLocaleString("tr-TR")} TL</strong>
      </article>
    </section>
  );
}

export default StatsGrid;
