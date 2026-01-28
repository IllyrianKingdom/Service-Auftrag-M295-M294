import './dashboard.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard-page">
      
      <header className="dashboard-header">
        <h1 className="company-name">AVA GmbH</h1>
        <span className="user-info">BL {user?.name || 'User'}</span>
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
            <li><a href="/mitarbeiter" className="menu-item">Mitarbeiter</a></li>
            <li><a href="/kunden" className="menu-item">Kunden</a></li>
            <li><a href="/verrechnungen" className="menu-item">Verrechnungen</a></li>

            <li><button onClick={handleLogout} className="menu-item logout" style={{background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left'}}>Logout</button></li>
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