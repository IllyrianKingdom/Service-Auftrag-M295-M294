import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Auftraege.css';

function Auftraege() {
  // ========== API CONFIG (VITE) ==========
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ava-ch.infinityfreeapp.com';
  const AUFTRAEGE_ENDPOINT = `${API_BASE_URL}/api/auftraege.php`;
  const KUNDEN_ENDPOINT = `${API_BASE_URL}/api/kunden.php`;

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

// Add this fetch helper with CORS mode
const fetchWithCORS = async (url, options = {}) => {
  return fetch(url, {
    ...options,
    mode: 'cors', // Explicitly enable CORS
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
};

// Usage in your functions:
const fetchAuftraege = async () => {
  try {
    setLoading(true);
    const response = await fetchWithCORS(AUFTRAEGE_ENDPOINT);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    setAlleAuftraege(data);
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
      const response = await fetch(KUNDEN_ENDPOINT);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setAlleKunden(data);
    } catch (err) {
      console.error('Failed to fetch kunden:', err);
      setError('Kunden konnten nicht geladen werden');
    }
  };

  // ========== FILTER & SEARCH ==========
  useEffect(() => {
    let gefilterte = alleAuftraege;

    // Status Filter
    if (filterStatus !== 'alle') {
      gefilterte = gefilterte.filter(auftrag => auftrag.Status === filterStatus);
    }

    // Suche (nach Firma oder Auftragsname)
    if (suchbegriff) {
      gefilterte = gefilterte.filter(auftrag =>
        (auftrag.Firma && auftrag.Firma.toLowerCase().includes(suchbegriff.toLowerCase())) ||
        auftrag.Auftragsname.toLowerCase().includes(suchbegriff.toLowerCase())
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
        Erfasst_von: 1 // ← Update with actual user ID from auth
      };

      const response = await fetch(AUFTRAEGE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Fehler beim Erstellen des Auftrags');
      }

      // Refresh auftraege list
      await fetchAuftraege();
      
      // Reset form
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
      const response = await fetch(`${AUFTRAEGE_ENDPOINT}?delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Auftrag_id: auftrag_id })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Fehler beim Löschen des Auftrags');
      }

      // Refresh auftraege list
      await fetchAuftraege();
      setError(null);
    } catch (err) {
      console.error('Failed to delete auftrag:', err);
      setError(`Fehler: ${err.message}`);
    }
  };

  const handleStatusChange = async (auftrag_id, newStatus) => {
    try {
      const response = await fetch(`${AUFTRAEGE_ENDPOINT}?update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          Auftrag_id: auftrag_id,
          Status: newStatus 
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Fehler beim Aktualisieren des Status');
      }

      // Refresh auftraege list
      await fetchAuftraege();
      setError(null);
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(`Fehler: ${err.message}`);
    }
  };

  // ========== HELPER FUNCTIONS ==========
  const getKundenName = (kunden_id) => {
    const kunde = alleKunden.find(k => k.Kunden_id === kunden_id);
    return kunde ? (kunde.Firma || `${kunde.Vorname} ${kunde.Name}`) : 'Unbekannt';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-CH', { month: '2-digit', day: '2-digit' });
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
              <option value="in-progress">In Bearbeitung</option>
              <option value="completed">Abgeschlossen</option>
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
                  <option key={kunde.Kunden_id} value={kunde.Kunden_id}>
                    {kunde.Firma || `${kunde.Vorname} ${kunde.Name}`}
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
                <option value="in-progress">In Bearbeitung</option>
                <option value="completed">Abgeschlossen</option>
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
            <div key={auftrag.Auftrag_id} className="auftrag-karte">
              <div className="karte-header">
                <h3>{getKundenName(auftrag.Kunden_id)}</h3>
                <button 
                  className="delete-btn" 
                  onClick={() => handleDelete(auftrag.Auftrag_id)}
                  title="Löschen"
                >
                  ×
                </button>
              </div>
              <div className="karte-body">
                <p>{auftrag.Auftragsname}</p>
                <div className="karte-footer">
                  <select
                    className={`status-select status-${auftrag.Status}`}
                    value={auftrag.Status}
                    onChange={(e) => handleStatusChange(auftrag.Auftrag_id, e.target.value)}
                  >
                    <option value="erfasst">Erfasst</option>
                    <option value="in-progress">In Bearbeitung</option>
                    <option value="completed">Abgeschlossen</option>
                  </select>
                  <span className="datum">{formatDate(auftrag.Angefangen_am)}</span>
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