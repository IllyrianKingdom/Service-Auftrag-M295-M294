import './dashboard.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useEffect, useState } from 'react';
import { API_ENDPOINTS, apiCall } from '../services/api';

import { SiGoogletasks } from "react-icons/si";
import { FaCarSide } from "react-icons/fa";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { IoIosPeople } from "react-icons/io";
import { FaFileInvoiceDollar } from "react-icons/fa";

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
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

  // ROLLE-BERECHTIGUNGEN
  const userRole = user?.role;
  const allowedLinks = {
    'geschaeftsleiter': 6,  // Alle 6 Links
    'bereichsleiter': 5,    // 5 Links (ohne Mitarbeiter)
    'mitarbeiter': 3,       // Nur 3 Links
    'administration': 6     // Alle Links
  };
  const maxLinks = allowedLinks[userRole] || 0;

  useEffect(() => {
    async function fetchCounts() {
      try {
        setLoading(true);
        setError('');

        // ⭐ KORRIGIERT: Alle API-Calls inklusive Berichte
        const calls = [];
        
        // Index 0: Aufträge
        if (maxLinks >= 1) calls.push(apiCall(API_ENDPOINTS.auftraege, 'GET'));
        
        // Index 1: Dispositionen  
        if (maxLinks >= 2) calls.push(apiCall(API_ENDPOINTS.disposition, 'GET'));
        
        // Index 2: Berichte ⭐ JETZT HINZUGEFÜGT!
        if (maxLinks >= 3) calls.push(apiCall(API_ENDPOINTS.berichte, 'GET'));
        
        // Index 3: Mitarbeiter
        if (maxLinks >= 4 && userRole !== 'mitarbeiter') calls.push(apiCall(API_ENDPOINTS.mitarbeiter, 'GET'));
        
        // Index 4: Kunden
        if (maxLinks >= 5 && userRole !== 'mitarbeiter') calls.push(apiCall(API_ENDPOINTS.kunden, 'GET'));
        
        // Index 5: Verrechnungen
        if (maxLinks >= 6 && userRole !== 'mitarbeiter') calls.push(apiCall(API_ENDPOINTS.verrechnung, 'GET'));

        const results = await Promise.all(calls);
        
        setCounts({
          auftraege: results[0]?.length || 0,
          dispositionen: results[1]?.length || 0,
          berichte: results[2]?.length || 0,  // ⭐ Jetzt korrekt!
          mitarbeiter: maxLinks >= 4 && userRole !== 'mitarbeiter' ? results[3]?.length || 0 : 0,
          kunden: maxLinks >= 5 && userRole !== 'mitarbeiter' ? results[4]?.length || 0 : 0,
          verrechnungen: maxLinks >= 6 && userRole !== 'mitarbeiter' ? results[5]?.length || 0 : 0,
        });
      } catch (err) {
        console.error('Dashboard Fehler:', err);
        setError('Fehler beim Laden der Dashboard-Daten');
      } finally {
        setLoading(false);
      }
    }

    if (user) fetchCounts();
  }, [user, maxLinks]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { key: 1, href: '/auftraege', label: 'Aufträge', minRole: 1 },
    { key: 2, href: '/disposition', label: 'Disposition', minRole: 2 },
    { key: 3, href: '/berichte', label: 'Berichte', minRole: 3 },
    { key: 4, href: '/mitarbeiter', label: 'Mitarbeiter', minRole: 4, excludeRole: 'mitarbeiter' },
    { key: 5, href: '/kunden', label: 'Kunden', minRole: 5, excludeRole: 'mitarbeiter' },
    { key: 6, href: '/verrechnungen', label: 'Verrechnungen', minRole: 6, excludeRole: 'mitarbeiter' }
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="company-name">AVA GmbH</h1>
        <span className="user-info">
          {user?.name || 'User'} 
          <span style={{fontSize: '0.9em', color: '#666', marginLeft: '10px'}}>
            ({userRole || 'keine Rolle'})
          </span>
        </span>
      </header>
      
      <div className="dashboard-layout">
        <nav className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2>Dashboard</h2>
            <small>Rolle: {userRole || 'Gast'}</small>
          </div>
          <ul className="menu-list">
            {menuItems.map(item => 
              (maxLinks >= item.minRole && 
               (!item.excludeRole || userRole !== item.excludeRole)) ? (
                <li key={item.key}>
                  <a href={item.href} className="menu-item">{item.label}</a>
                </li>
              ) : null
            )}
            <li>
              <button onClick={handleLogout} className="menu-item logout" 
                      style={{background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left'}}>
                Logout
              </button>
            </li>
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
                
                {maxLinks >= 4 && (
                  <>
                    <div className="stat-card">
                      <div className="stat-icon mitarbeiter"><IoIosPeople /></div>
                      <div className="stat-info">
                        <h3>Mitarbeiter</h3>
                        <p className="stat-count">{counts.mitarbeiter}</p>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon kunden"><IoIosPeople /></div>
                      <div className="stat-info">
                        <h3>Kunden</h3>
                        <p className="stat-count">{counts.kunden}</p>
                      </div>
                    </div>

                    {maxLinks >= 6 && userRole !== 'mitarbeiter' && (
                      <div className="stat-card">
                        <div className="stat-icon verrechnungen"><FaFileInvoiceDollar /></div>
                        <div className="stat-info">
                          <h3>Verrechnungen</h3>
                          <p className="stat-count">{counts.verrechnungen}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
