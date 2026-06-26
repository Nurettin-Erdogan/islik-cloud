function DashboardHeader({ userEmail, onLogout }) {
  return (
    <section className="hero">
      <p className="eyebrow">İşlik Cloud</p>
      <h1>Küçük servis işletmeleri için iş takip paneli</h1>
      <p className="hero-text">
        Müşteri, servis işi ve ödeme durumlarını PostgreSQL destekli API üzerinden
        yöneten full-stack uygulama.
      </p>

      <div className="session-bar">
        <span>{userEmail}</span>
        <button type="button" className="secondary-button" onClick={onLogout}>
          Çıkış Yap
        </button>
      </div>
    </section>
  );
}

export default DashboardHeader;
