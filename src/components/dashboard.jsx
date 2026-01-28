import './dashboard.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

//React Icons Für Dashboard
import { SiGoogletasks } from "react-icons/si";
import { FaCarSide } from "react-icons/fa";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { IoIosPeople } from "react-icons/io";
import { FaFileInvoiceDollar } from "react-icons/fa";

function Dashboard() {
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>  
   

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
          <div className="dashboard-main">
            <h2 className="section-title">Übersicht</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon auftraege"><SiGoogletasks /></div>
                <div className="stat-info">
                  <h3>Aufträge</h3>
                  <p className="stat-count">15</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon dispositionen"><FaCarSide /></div>
                <div className="stat-info">
                  <h3>Dispositionen</h3>
                  <p className="stat-count">12</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon berichte"><HiOutlineDocumentReport /></div>
                <div className="stat-info">
                  <h3>Berichte</h3>
                  <p className="stat-count">8</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon mitarbeiter"><IoIosPeople /></div>
                <div className="stat-info">
                  <h3>Mitarbeiter</h3>
                  <p className="stat-count">15</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon mitarbeiter"><IoIosPeople /></div>
                <div className="stat-info">
                  <h3>Kunden</h3>
                  <p className="stat-count">15</p>    
                </div>
                 </div>
              <div className="stat-card">
                <div className="stat-icon mitarbeiter"><FaFileInvoiceDollar /></div>
                <div className="stat-info">
                  <h3>Verrechnungen</h3>
                  <p className="stat-count">15</p>    
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  );
}

export default Dashboard;