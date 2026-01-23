import './dashboard.css';
// Dashboard-Komponente mit Header, Sidebar und Hauptbereich
function Dashboard() {
  return (
    <div className="dashboard-page">
      
      <header className="dashboard-header">
        <h1 className="company-name">AVA GmbH</h1>
        <span className="user-info">BL Vedran Jerkovic</span>
      </header>
      
      <div className="dashboard-layout">
        <nav className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2>Dashboard</h2>
          </div>
          <ul className="menu-list">
            <li><a href="/auftraege" className="menu-item">Aufträge</a></li>
            <li><a href="/disposition" className="menu-item">Disposition</a></li>
            <li><a href="/berichte" className="menu-item">Berichte</a></li>
            <li><a href="/einstellungen" className="menu-item">Einstellungen</a></li>
            <li><a href="/logout" className="menu-item logout">Logout</a></li>
          </ul>
        </nav>

        <main className="dashboard-content">
          <div className="content-placeholder">
            Hauptbereich für Charts & Daten
          </div>
        </main>
      </div>
    </div>
  );
}
export default Dashboard;