import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS, apiCall } from '../services/api.jsx';
import './verrechnungen.css';

function Verrechnungen() {
  // ========== STATE ==========
  const [alleVerrechnungen, setAlleVerrechnungen] = useState([]);
  const [verrechnungen, setVerrechnungen] = useState([]);
  const [alleAuftraege, setAlleAuftraege] = useState([]);
  const [neueRechnung, setNeueRechnung] = useState({
    Auftrag_id: '',
    Rechnungsdatum: '',
    Betrag: '',
    Status: 'offen',
    Bemerkung: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [suchbegriff, setSuchbegriff] = useState('');
  const [filterStatus, setFilterStatus] = useState('alle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ========== FETCH DATA ==========
  useEffect(() => {
    fetchVerrechnungen();
    fetchAuftraege();
  }, []);

  const fetchVerrechnungen = async () => {
    try {
      setLoading(true);
      const response = await apiCall(API_ENDPOINTS.verrechnung);
      setAlleVerrechnungen(response);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch verrechnungen:', err);
      setError('Verrechnungen konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuftraege = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.auftraege);
      setAlleAuftraege(response);
    } catch (err) {
      console.error('Failed to fetch auftraege:', err);
      setError('Aufträge konnten nicht geladen werden');
    }
  };

  // ========== FILTER & SEARCH ==========
  useEffect(() => {
    let gefilterte = alleVerrechnungen;

    // Status Filter - snake_case!
    if (filterStatus !== 'alle') {
      gefilterte = gefilterte.filter(v => v.status === filterStatus);
    }

    // Suche (nach Kunde oder Auftrag) - snake_case!
    if (suchbegriff) {
      gefilterte = gefilterte.filter(v =>
        (v.firma && v.firma.toLowerCase().includes(suchbegriff.toLowerCase())) ||
        (v.auftragsname && v.auftragsname.toLowerCase().includes(suchbegriff.toLowerCase()))
      );
    }

    setVerrechnungen(gefilterte);
  }, [suchbegriff, filterStatus, alleVerrechnungen]);

  // ========== FORM HANDLERS ==========
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNeueRechnung(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!neueRechnung.Auftrag_id || !neueRechnung.Betrag) {
      setError('Bitte füllen Sie alle erforderlichen Felder aus');
      return;
    }

    try {
      const payload = {
        Auftrag_id: parseInt(neueRechnung.Auftrag_id),
        Rechnungsdatum: neueRechnung.Rechnungsdatum || new Date().toISOString().split('T')[0],
        Betrag: parseFloat(neueRechnung.Betrag),
        Status: neueRechnung.Status,
        Bemerkung: neueRechnung.Bemerkung
      };

      await apiCall(API_ENDPOINTS.verrechnung, 'POST', payload);

      await fetchVerrechnungen();

      setNeueRechnung({
        Auftrag_id: '',
        Rechnungsdatum: '',
        Betrag: '',
        Status: 'offen',
        Bemerkung: ''
      });
      setShowForm(false);
      setError(null);
    } catch (err) {
      console.error('Failed to create verrechnung:', err);
      setError(`Fehler: ${err.message}`);
    }
  };

  const handleDelete = async (verrechnung_id) => {
    if (!window.confirm('Diese Rechnung wirklich löschen?')) return;

    try {
      await apiCall(API_ENDPOINTS.verrechnung + '?delete', 'POST', {
        Verrechnung_id: verrechnung_id
      });

      await fetchVerrechnungen();
      setError(null);
    } catch (err) {
      console.error('Failed to delete verrechnung:', err);
      setError(`Fehler: ${err.message}`);
    }
  };

  const handleStatusChange = async (verrechnung_id, newStatus) => {
    try {
      await apiCall(API_ENDPOINTS.verrechnung + '?update', 'POST', {
        Verrechnung_id: verrechnung_id,
        Status: newStatus
      });

      await fetchVerrechnungen();
      setError(null);
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(`Fehler: ${err.message}`);
    }
  };

  // ========== HELPER FUNCTIONS ==========
  const getAuftragInfo = (auftrag_id) => {
    const auftrag = alleAuftraege.find(a => a.auftrag_id === auftrag_id);
    return auftrag ? { 
      auftragsname: auftrag.auftragsname,
      firma: auftrag.firma || 'Unbekannt'
    } : { 
      auftragsname: 'Unbekannt',
      firma: 'Unbekannt'
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-CH', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (betrag) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(betrag);
  };

  // ========== RENDER ==========
  return (
    <div className="verrechnungen-fullscreen">
      {/* HEADER */}
      <div className="verrechnungen-header">
        <div className="header-left">
          <Link to="/dashboard" className="back-btn">
            ← Dashboard
          </Link>
          <h1>Verrechnungen</h1>
          <div className="verrechnungen-stats">
            <span className="anzahl">{alleVerrechnungen.length}</span>
            <span className="label">Rechnungen</span>
          </div>
        </div>

        <div className="header-controls">
          <div className="suchleiste">
            <input
              type="text"
              placeholder="Verrechnungen suchen..."
              value={suchbegriff}
              onChange={(e) => setSuchbegriff(e.target.value)}
            />
          </div>
          <div className="filter-select">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="alle">Alle</option>
              <option value="offen">Offen</option>
              <option value="bezahlt">Bezahlt</option>
              <option value="überfällig">Überfällig</option>
            </select>
          </div>
          <button
            className="neue-rechnung-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Abbrechen' : '+ Neue Rechnung'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* NEUE RECHNUNG FORM */}
      {showForm && (
        <div className="neuer-termin-form-wrapper">
          <h3>Neue Rechnung erstellen</h3>
          <form className="neuer-termin-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <select
                name="Auftrag_id"
                value={neueRechnung.Auftrag_id}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Auftrag wählen --</option>
                {alleAuftraege.map(a => (
                  <option key={a.auftrag_id} value={a.auftrag_id}>
                    {a.auftragsname}
                  </option>
                ))}
              </select>
              <input
                name="Rechnungsdatum"
                type="date"
                value={neueRechnung.Rechnungsdatum}
                onChange={handleInputChange}
              />
              <input
                name="Betrag"
                type="number"
                step="0.01"
                placeholder="Betrag (CHF) *"
                value={neueRechnung.Betrag}
                onChange={handleInputChange}
                required
              />
              <select
                name="Status"
                value={neueRechnung.Status}
                onChange={handleInputChange}
              >
                <option value="offen">Offen</option>
                <option value="bezahlt">Bezahlt</option>
                <option value="überfällig">Überfällig</option>
              </select>
              <input
                name="Bemerkung"
                placeholder="Bemerkung (optional)"
                value={neueRechnung.Bemerkung}
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
                Rechnung speichern
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="verrechnungen-timeline">
        {loading ? (
          <div className="empty-state">
            <h3>Verrechnungen werden geladen...</h3>
          </div>
        ) : verrechnungen.length === 0 ? (
          <div className="empty-state">
            <h3>Keine Verrechnungen gefunden</h3>
            <p>Versuche die Suche anzupassen oder erstelle eine neue Rechnung</p>
          </div>
        ) : (
          <>
            <div className='timeline-header'>
            <div className="kunde-header">
              <span>Kunde</span>
            </div>
            <div className="auftrag-header">
              <span>Auftrag</span>
            </div>
              <div className="status-header">
              <span>Status</span>
               </div>
              <div className="betrag-header">
              <span>Betrag</span>
              </div>
              <div className="datum-header">
              <span>Rechnungsdatum</span>
              </div>
              <span></span>
              </div>

            {verrechnungen.map(v => {
              const auftragInfo = getAuftragInfo(v.auftrag_id);
              return (
                <div key={v.verrechnung_id} className="verr-zeile">
                  <div className="verr-kunde">
                    <div className="avatar">{auftragInfo.firma.charAt(0)}</div>
                    <span>{auftragInfo.firma}</span>
                  </div>
                  <div className="verr-auftrag">
                    <h4>{auftragInfo.auftragsname}</h4>
                    {v.bemerkung && <small>{v.bemerkung}</small>}
                  </div>
                  <div className="verr-status">
                    <select
                      className={`status-select status-${v.status}`}
                      value={v.status}
                      onChange={(e) => handleStatusChange(v.verrechnung_id, e.target.value)}
                    >
                      <option value="offen">Offen</option>
                      <option value="bezahlt">Bezahlt</option>
                      <option value="überfällig">Überfällig</option>
                    </select>
                  </div>
                  <div className="verr-betrag">
                    <strong>{formatCurrency(v.betrag)}</strong>
                  </div>
                  <div className="verr-datum">
                    {formatDate(v.rechnungsdatum)}
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(v.verrechnung_id)}
                    title="Löschen"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export default Verrechnungen;