function DashboardHeader({ userEmail, onLogout }) {
  return (
    <header className="dashboard-header">
      <div className="brand-lockup">
        <span className="brand-mark">D</span>
        <div>
          <p className="eyebrow">Dükkan Defteri</p>
          <h1>Dükkan Özeti</h1>
        </div>
      </div>

      <div className="session-bar">
        <span className="session-user">{userEmail}</span>
        <button type="button" className="secondary-button" onClick={onLogout}>
          Çıkış Yap
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;
