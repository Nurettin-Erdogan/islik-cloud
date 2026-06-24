import "./App.css";

function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">İşlik Cloud</p>
        <h1>Küçük servis işletmeleri için iş takip paneli</h1>
        <p className="hero-text">
          Müşterileri, servis işlerini, ödeme durumlarını ve günlük operasyonları
          tek bir bulut panelinden yönetmek için geliştirilen full-stack uygulama.
        </p>

        <div className="hero-actions">
          <a href="#modules" className="primary-button">
            Modülleri Gör
          </a>
          <a href="#roadmap" className="secondary-button">
            Yol Haritası
          </a>
        </div>
      </section>

      <section id="modules" className="cards">
        <article className="card">
          <h2>Müşteriler</h2>
          <p>Müşteri bilgileri, iletişim detayları ve geçmiş servis kayıtları.</p>
        </article>

        <article className="card">
          <h2>İşler</h2>
          <p>Bekleyen, devam eden ve tamamlanan servis işlerini takip etme.</p>
        </article>

        <article className="card">
          <h2>Ödemeler</h2>
          <p>Ödenmiş, bekleyen ve kısmi ödemeleri tek panelden izleme.</p>
        </article>

        <article className="card">
          <h2>Dashboard</h2>
          <p>Günlük işler, aylık gelir ve bekleyen ödemeler için özet ekran.</p>
        </article>
      </section>

      <section id="roadmap" className="roadmap">
        <h2>İlk geliştirme planı</h2>
        <ol>
          <li>React arayüz iskeleti</li>
          <li>API bağlantısı</li>
          <li>Müşteri listeleme</li>
          <li>İş kayıtları</li>
          <li>Giriş sistemi</li>
        </ol>
      </section>
    </main>
  );
}

export default App;
