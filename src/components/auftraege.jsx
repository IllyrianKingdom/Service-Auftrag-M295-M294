import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS, apiCall } from '../services/api.jsx';
import './auftraege.css';

function Auftraege() {
  // ========== STATE ==========
  const [alleAuftraege, setAlleAuftraege] = useState([]);
  const [auftraege, setAuftraege] = useState([]);
  const [alleKunden, setAlleKunden] = useState([]);
  const [neuerAuftrag, setNeuerAuftrag] = useState({
    Kunden_id: '',
    Auftragsname: '',
    Status: 'erfasst',
    Angefangen_am: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [suchbegriff, setSuchbegriff] = useState('');
  const [filterStatus, setFilterStatus] = useState('alle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ========== FETCH AUFTRAEGE & KUNDEN ==========
  useEffect(() => {
    fetchAuftraege();
    fetchKunden();
  }, []);

  const fetchAuftraege = async () => {
    try {
      setLoading(true);
      const response = await apiCall(API_ENDPOINTS.auftraege);
      setAlleAuftraege(response);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch auftraege:', err);
      setError('Aufträge konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const fetchKunden = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.kunden);
      setAlleKunden(response);
    } catch (err) {
      console.error('Failed to fetch kunden:', err);
      setError('Kunden konnten nicht geladen werden');
    }
  };

  // ========== FILTER & SEARCH ==========
  useEffect(() => {
    let gefilterte = alleAuftraege;

    // Status Filter - ACHTUNG: snake_case in Daten!
    if (filterStatus !== 'alle') {
      gefilterte = gefilterte.filter(auftrag => auftrag.status === filterStatus);
    }

    // Suche (nach Firma oder Auftragsname) - snake_case!
    if (suchbegriff) {
      gefilterte = gefilterte.filter(auftrag =>
        (auftrag.firma && auftrag.firma.toLowerCase().includes(suchbegriff.toLowerCase())) ||
        auftrag.auftragsname.toLowerCase().includes(suchbegriff.toLowerCase())
      );
    }

    setAuftraege(gefilterte);
  }, [suchbegriff, filterStatus, alleAuftraege]);

  // ========== FORM HANDLERS ==========
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNeuerAuftrag(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!neuerAuftrag.Kunden_id || !neuerAuftrag.Auftragsname) {
      setError('Bitte füllen Sie alle erforderlichen Felder aus');
      return;
    }

    try {
      const payload = {
        Kunden_id: parseInt(neuerAuftrag.Kunden_id),
        Auftragsname: neuerAuftrag.Auftragsname,
        Status: neuerAuftrag.Status,
        Angefangen_am: neuerAuftrag.Angefangen_am || new Date().toISOString().split('T')[0],
        Erfasst_von: 1
      };

      await apiCall(API_ENDPOINTS.auftraege, 'POST', payload);

      await fetchAuftraege();

      setNeuerAuftrag({
        Kunden_id: '',
        Auftragsname: '',
        Status: 'erfasst',
        Angefangen_am: ''
      });
      setShowForm(false);
      setError(null);
    } catch (err) {
      console.error('Failed to create auftrag:', err);
      setError(`Fehler: ${err.message}`);
    }
  };

  const handleDelete = async (auftrag_id) => {
    if (!window.confirm('Diesen Auftrag wirklich löschen?')) return;

    try {
      await apiCall(API_ENDPOINTS.auftraege + '?delete', 'POST', {
        Auftrag_id: auftrag_id
      });

      await fetchAuftraege();
      setError(null);
    } catch (err) {
      console.error('Failed to delete auftrag:', err);
      setError(`Fehler: ${err.message}`);
    }
  };

  const handleStatusChange = async (auftrag_id, newStatus) => {
    try {
      await apiCall(API_ENDPOINTS.auftraege + '?update', 'POST', {
        Auftrag_id: auftrag_id,
        Status: newStatus
      });

      await fetchAuftraege();
      setError(null);
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(`Fehler: ${err.message}`);
    }
  };

  // ========== HELPER FUNCTIONS ==========
  const getKundenName = (kunden_id) => {
    // WICHTIG: snake_case in den API-Daten!
    const kunde = alleKunden.find(k => k.kunden_id === kunden_id);
    return kunde ? (kunde.firma || `${kunde.vorname} ${kunde.name}`) : 'Unbekannt';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-CH', { month: '2-digit', day: '2-digit', year: '2-digit' });
  };

  // ========== RENDER ==========
  return (
    <div className="auftraege-fullscreen">
      <div className="auftraege-header">
        <div className="header-left">
          <Link to="/dashboard" className="back-btn">
            ← Dashboard
          </Link>
          <h1>Aufträge</h1>
          <div className="auftraege-anzahl">
            <span className="anzahl">{alleAuftraege.length}</span>
            <span className="label">Übersicht</span>
          </div>
        </div>

        <div className="header-controls">
          <div className="suchleiste">
            <input
              type="text"
              placeholder="Aufträge suchen..."
              value={suchbegriff}
              onChange={(e) => setSuchbegriff(e.target.value)}
            />
          </div>
          <div className="filter-select">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="alle">Alle</option>
              <option value="erfasst">Erfasst</option>
              <option value="disponiert">Disponiert</option>
              <option value="ausgeführt">Ausgeführt</option>
              <option value="freigegeben">Freigegeben</option>
              <option value="verrechnet">Verrechnet</option>
            </select>
          </div>
          <button className="neu-auftrag-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Abbrechen' : 'Neuer Auftrag +'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {showForm && (
        <div className="auftrag-form-container">
          <form className="auftrag-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <select
                name="Kunden_id"
                value={neuerAuftrag.Kunden_id}
                onChange={handleInputChange}
                className="custom-select"
                required
              >
                <option value="">-- Kunde wählen --</option>
                {alleKunden.map(kunde => (
                  <option key={kunde.kunden_id} value={kunde.kunden_id}>
                    {kunde.firma || `${kunde.vorname} ${kunde.name}`}
                  </option>
                ))}
              </select>
              <input
                name="Auftragsname"
                placeholder="Auftragsname"
                value={neuerAuftrag.Auftragsname}
                onChange={handleInputChange}
                required
              />
              <select
                name="Status"
                value={neuerAuftrag.Status}
                onChange={handleInputChange}
                className="custom-select"
              >
                <option value="erfasst">Erfasst</option>
                <option value="disponiert">Disponiert</option>
                <option value="ausgeführt">Ausgeführt</option>
                <option value="freigegeben">Freigegeben</option>
                <option value="verrechnet">Verrechnet</option>
              </select>
              <input
                name="Angefangen_am"
                type="date"
                value={neuerAuftrag.Angefangen_am}
                onChange={handleInputChange}
              />
            </div>
            <button type="submit">Auftrag erstellen</button>
          </form>
        </div>
      )}

      {/* AUFTRÄGE KARTEN */}
      <div className="auftraege-karten">
        {loading ? (
          <div className="empty-state">
            <h3>Aufträge werden geladen...</h3>
          </div>
        ) : auftraege.length === 0 ? (
          <div className="empty-state">
            <h3>Keine Aufträge gefunden</h3>
            <p>Versuche die Suche anzupassen oder erstelle einen neuen Auftrag</p>
          </div>
        ) : (
          auftraege.map(auftrag => (
            <div key={auftrag.auftrag_id} className="auftrag-karte">
              <div className="karte-header">
                <h3>{getKundenName(auftrag.kunden_id)}</h3>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(auftrag.auftrag_id)}
                  title="Löschen"
                >
                  ×
                </button>
              </div>
              <div className="karte-body">
                <p>{auftrag.auftragsname}</p>
                <div className="karte-footer">
                  <select
                    className={`status-select status-${auftrag.status}`}
                    value={auftrag.status}
                    onChange={(e) => handleStatusChange(auftrag.auftrag_id, e.target.value)}
                  >
                    <option value="erfasst">Erfasst</option>
                    <option value="disponiert">Disponiert</option>
                    <option value="ausgeführt">Ausgeführt</option>
                    <option value="freigegeben">Freigegeben</option>
                    <option value="verrechnet">Verrechnet</option>
                  </select>
                  <span className="datum">{formatDate(auftrag.angefangen_am)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Auftraege;
