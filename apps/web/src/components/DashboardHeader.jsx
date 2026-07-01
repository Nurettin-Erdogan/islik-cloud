function DashboardHeader({ eyebrow, title }) {
  return (
    <header className="dashboard-header">
      <div className="page-title">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
    </header>
  );
}

export default DashboardHeader;
