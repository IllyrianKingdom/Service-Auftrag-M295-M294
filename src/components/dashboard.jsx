import './dashboard.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useEffect, useState } from 'react';
import { API_ENDPOINTS, apiCall } from '../services/api';

// React Icons Für Dashboard
import { SiGoogletasks } from "react-icons/si";
import { FaCarSide } from "react-icons/fa";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { IoIosPeople } from "react-icons/io";
import { FaFileInvoiceDollar } from "react-icons/fa";

function Dashboard() {
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // State für die Zählungen
  const [counts, setCounts] = useState({
    auftraege: 0,
    dispositionen: 0,
    berichte: 0,
    mitarbeiter: 0,
    kunden: 0,
    verrechnungen: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Daten beim Mount laden
  useEffect(() => {
    async function fetchCounts() {
      try {
        setLoading(true);
        setError('');

        // Alle Daten parallel laden
        const [
          auftragData,
          dispositionData,
          mitarbeiterData,
          kundenData,
          verrechnungData,
        ] = await Promise.all([
          apiCall(API_ENDPOINTS.auftraege, 'GET'),
          apiCall(API_ENDPOINTS.disposition, 'GET'),
          apiCall(API_ENDPOINTS.mitarbeiter, 'GET'),
          apiCall(API_ENDPOINTS.kunden, 'GET'),
          apiCall(API_ENDPOINTS.verrechnung, 'GET'),
        ]);

        setCounts({
          auftraege: auftragData?.length || 0,
          dispositionen: dispositionData?.length || 0,
          berichte: 0, // Falls du einen separaten Endpoint hast, hier anpassen
          mitarbeiter: mitarbeiterData?.length || 0,
          kunden: kundenData?.length || 0,
          verrechnungen: verrechnungData?.length || 0,
        });
      } catch (err) {
        console.error('Dashboard Fehler:', err);
        setError('Fehler beim Laden der Dashboard-Daten');
      } finally {
        setLoading(false);
      }
    }

    fetchCounts();
  }, []);

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
              
              {error && <div style={{color: 'red', marginBottom: '20px'}}>{error}</div>}
              {loading && <div>Dashboard wird geladen...</div>}
              
              {!loading && (
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon auftraege"><SiGoogletasks /></div>
                    <div className="stat-info">
                      <h3>Aufträge</h3>
                      <p className="stat-count">{counts.auftraege}</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon dispositionen"><FaCarSide /></div>
                    <div className="stat-info">
                      <h3>Dispositionen</h3>
                      <p className="stat-count">{counts.dispositionen}</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon berichte"><HiOutlineDocumentReport /></div>
                    <div className="stat-info">
                      <h3>Berichte</h3>
                      <p className="stat-count">{counts.berichte}</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon mitarbeiter"><IoIosPeople /></div>
                    <div className="stat-info">
                      <h3>Mitarbeiter</h3>
                      <p className="stat-count">{counts.mitarbeiter}</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon mitarbeiter"><IoIosPeople /></div>
                    <div className="stat-info">
                      <h3>Kunden</h3>
                      <p className="stat-count">{counts.kunden}</p>    
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon mitarbeiter"><FaFileInvoiceDollar /></div>
                    <div className="stat-info">
                      <h3>Verrechnungen</h3>
                      <p className="stat-count">{counts.verrechnungen}</p>    
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
