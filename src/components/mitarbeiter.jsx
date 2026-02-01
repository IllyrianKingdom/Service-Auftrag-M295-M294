import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS, apiCall } from '../services/api.jsx';
import './mitarbeiter.css';


function Mitarbeiter() {
  // ========== STATE ==========
  const [alleMitarbeiter, setAlleMitarbeiter] = useState([]);
  const [mitarbeiter, setMitarbeiter] = useState([]);
  const [neuerMitarbeiter, setNeuerMitarbeiter] = useState({
    Vorname: '',
    Name: '',
    Rolle: 'MA',
    Status: 'Aktiv',
    Telefonnummer: '',
    Email: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [suchbegriff, setSuchbegriff] = useState('');
  const [filterRolle, setFilterRolle] = useState('alle');
  const [filterStatus, setFilterStatus] = useState('alle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // ========== FETCH MITARBEITER ==========
  useEffect(() => {
    fetchMitarbeiter();
  }, []);


  const fetchMitarbeiter = async () => {
    try {
      setLoading(true);
      const response = await apiCall(API_ENDPOINTS.mitarbeiter);
      setAlleMitarbeiter(response);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch mitarbeiter:', err);
      setError('Mitarbeiter konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };


  // ========== FILTER & SEARCH ==========
  useEffect(() => {
    let gefilterte = alleMitarbeiter;


    // Rolle Filter - snake_case!
    if (filterRolle !== 'alle') {
      gefilterte = gefilterte.filter(m => m.rolle === filterRolle);
    }


    // Status Filter - snake_case!
    if (filterStatus !== 'alle') {
      gefilterte = gefilterte.filter(m => m.status === filterStatus);
    }


    // Suche (nach Name oder Vorname) - snake_case!
    if (suchbegriff) {
      gefilterte = gefilterte.filter(m =>
        (m.vorname && m.vorname.toLowerCase().includes(suchbegriff.toLowerCase())) ||
        (m.name && m.name.toLowerCase().includes(suchbegriff.toLowerCase()))
      );
    }


    setMitarbeiter(gefilterte);
  }, [suchbegriff, filterRolle, filterStatus, alleMitarbeiter]);


  // ========== FORM HANDLERS ==========
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNeuerMitarbeiter(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();


    if (!neuerMitarbeiter.Name) {
      setError('Bitte füllen Sie mindestens den Namen aus');
      return;
    }


    try {
      const payload = {
        Vorname: neuerMitarbeiter.Vorname || '',
        Name: neuerMitarbeiter.Name,
        Rolle: neuerMitarbeiter.Rolle,
        Status: neuerMitarbeiter.Status,
        Telefonnummer: neuerMitarbeiter.Telefonnummer || '',
        Email: neuerMitarbeiter.Email || ''
      };


      console.log('Sending payload:', payload);
      await apiCall(API_ENDPOINTS.mitarbeiter, 'POST', payload);


      await fetchMitarbeiter();


      setNeuerMitarbeiter({
        Vorname: '',
        Name: '',
        Rolle: 'MA',
        Status: 'Aktiv',
        Telefonnummer: '',
        Email: ''
      });
      setShowForm(false);
      setError(null);
    } catch (err) {
      console.error('Failed to create mitarbeiter:', err);
      setError(`Fehler: ${err.message}`);
    }
  };


  const handleDelete = async (mitarbeiter_id) => {
    if (!window.confirm('Diesen Mitarbeiter wirklich löschen?')) return;


    try {
      await apiCall(API_ENDPOINTS.mitarbeiter + '?delete', 'POST', {
        Mitarbeiter_id: mitarbeiter_id
      });


      await fetchMitarbeiter();
      setError(null);
    } catch (err) {
      console.error('Failed to delete mitarbeiter:', err);
      setError(`Fehler: ${err.message}`);
    }
  };


  const handleStatusChange = async (mitarbeiter_id, newStatus) => {
    try {
      await apiCall(API_ENDPOINTS.mitarbeiter + '?update', 'POST', {
        Mitarbeiter_id: mitarbeiter_id,
        Status: newStatus
      });


      await fetchMitarbeiter();
      setError(null);
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(`Fehler: ${err.message}`);
    }
  };


  // ========== HELPER FUNCTIONS ==========
  const getRolleLabel = (rolle) => {
    const rollen = {
      'GL': 'Geschäftsleitung',
      'BL': 'Betriebsleitung',
      'MA': 'Mitarbeiter'
    };
    return rollen[rolle] || rolle;
  };


  // Format timestamp to readable date
  const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  
  // Addiere 1 Stunde hinzu (CET/CEST Offset)
  date.setHours(date.getHours() + 1);
  
  return date.toLocaleDateString('de-CH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

  // ========== RENDER ==========
  return (
    <div className="disposition-fullscreen">
      {/* HEADER */}
      <div className="disposition-header">
        <div className="header-left">
          <Link to="/dashboard" className="back-btn">
            ← Dashboard
          </Link>
          <h1>Mitarbeiterverwaltung</h1>
          <div className="disposition-stats">
            <span className="anzahl">{alleMitarbeiter.length}</span>
            <span className="label">Mitarbeiter</span>
          </div>
        </div>


        <div className="header-controls">
          <div className="suchleiste">
            <input
              type="text"
              placeholder="Mitarbeiter suchen..."
              value={suchbegriff}
              onChange={(e) => setSuchbegriff(e.target.value)}
            />
          </div>
          <div className="filter-select">
            <select value={filterRolle} onChange={(e) => setFilterRolle(e.target.value)}>
              <option value="alle">Alle Rollen</option>
              <option value="GL">Geschäftsleitung</option>
              <option value="BL">Betriebsleitung</option>
              <option value="MA">Mitarbeiter</option>
            </select>
          </div>
          <div className="filter-select">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="alle">Alle Status</option>
              <option value="Aktiv">Aktiv</option>
              <option value="Urlaub">Urlaub</option>
              <option value="Inaktiv">Inaktiv</option>
            </select>
          </div>
          <button
            className="neuer-termin-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Abbrechen' : '+ Neuer Mitarbeiter'}
          </button>
        </div>
      </div>


      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}


      {/* NEUER MITARBEITER FORM */}
      {showForm && (
        <div className="neuer-termin-form-wrapper">
          <h3>Neuen Mitarbeiter hinzufügen</h3>
          <form className="neuer-termin-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <input
                name="Vorname"
                placeholder="Vorname"
                value={neuerMitarbeiter.Vorname}
                onChange={handleInputChange}
              />
              <input
                name="Name"
                placeholder="Name *"
                value={neuerMitarbeiter.Name}
                onChange={handleInputChange}
                required
              />
              <select
                name="Rolle"
                value={neuerMitarbeiter.Rolle}
                onChange={handleInputChange}
              >
                <option value="GL">Geschäftsleitung</option>
                <option value="BL">Betriebsleitung</option>
                <option value="MA">Mitarbeiter</option>
              </select>
              <select
                name="Status"
                value={neuerMitarbeiter.Status}
                onChange={handleInputChange}
              >
                <option value="Aktiv">Aktiv</option>
                <option value="Urlaub">Urlaub</option>
                <option value="Inaktiv">Inaktiv</option>
              </select>
              <input
                name="Telefonnummer"
                placeholder="Telefonnummer"
                value={neuerMitarbeiter.Telefonnummer}
                onChange={handleInputChange}
              />
              <input
                name="Email"
                type="email"
                placeholder="Email"
                value={neuerMitarbeiter.Email}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowForm(false)}
              >
                Abbrechen
              </button>
              <button type="submit" className="speichern-btn">
                Mitarbeiter hinzufügen
              </button>
            </div>
          </form>
        </div>
      )}


      {/* MITARBEITER LISTE */}
      <div className="disposition-timeline">
        {loading ? (
          <div className="empty-state">
            <h3>Mitarbeiter werden geladen...</h3>
          </div>
        ) : mitarbeiter.length === 0 ? (
          <div className="empty-state">
            <h3>Keine Mitarbeiter gefunden</h3>
            <p>Versuche die Suche anzupassen oder füge einen neuen Mitarbeiter hinzu</p>
          </div>
        ) : (
          <>
            <div className="timeline-header">
              <span>Name</span>
              <span>Rolle</span>
              <span>Status</span>
              <span>Email</span>
              <span>Telefon</span>
              <span>Erstellt</span>
              <span></span>
            </div>


            {mitarbeiter.map(m => (
              <div key={m.mitarbeiter_id} className="dispo-zeile">
                <div className="dispo-mitarbeiter">
                  <div className="avatar">{m.vorname?.charAt(0) || m.name.charAt(0)}</div>
                  <div className="mitarbeiter-info">
                    <span className="name">{m.vorname && <span>{m.vorname}</span>} {m.name}</span>
                  </div>
                </div>
                <div className="dispo-auftrag">
                  <span className="label">Rolle</span>
                  <h4>{getRolleLabel(m.rolle)}</h4>
                </div>
                <div className="dispo-status">
                  <span className="label">Status</span>
                  <select
                    className={`status-select status-${m.status?.toLowerCase()}`}
                    value={m.status || 'Aktiv'}
                    onChange={(e) => handleStatusChange(m.mitarbeiter_id, e.target.value)}
                  >
                    <option value="Aktiv">Aktiv</option>
                    <option value="Urlaub">Urlaub</option>
                    <option value="Inaktiv">Inaktiv</option>
                  </select>
                </div>
                <div className="dispo-auftrag">
                  <span className="label">Email</span>
                  {m.email ? <span className="value">{m.email}</span> : <span className="value">-</span>}
                </div>
                <div className="dispo-termin">
                  <span className="label">Telefon</span>
                  <span className="zeit">{m.telefonnummer || '-'}</span>
                </div>
                <div className="dispo-datum">
                  <span className="label">Erstellt</span>
                  <span className="datum">{formatDate(m.created_at)}</span>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(m.mitarbeiter_id)}
                  title="Löschen"
                >
                  ×
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}


export default Mitarbeiter;