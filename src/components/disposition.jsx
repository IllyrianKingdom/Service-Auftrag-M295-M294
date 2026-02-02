import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS, apiCall } from '../services/api.jsx';
import './disposition.css';


function Disposition() {
  // ========== STATE ==========
  const [alleDispositionen, setAlleDispositionen] = useState([]);
  const [dispositionen, setDispositionen] = useState([]);
  const [alleMitarbeiter, setAlleMitarbeiter] = useState([]);
  const [alleAuftraege, setAlleAuftraege] = useState([]);
  const [neuerTermin, setNeuerTermin] = useState({
    Disponent_id: '',
    Mitarbeiter_id: '',
    Auftrag_id: '',
    Geplanter_Termin: '',
    Status: 'geplant',
    Notiz: ''
});

  const [showNewTermin, setShowNewTermin] = useState(false);
  const [suchbegriff, setSuchbegriff] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // ========== FETCH DATA ==========
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        const [dispositionen, mitarbeiter, auftraege] = await Promise.all([
          apiCall(API_ENDPOINTS.disposition),
          apiCall(API_ENDPOINTS.mitarbeiter),
          apiCall(API_ENDPOINTS.auftraege)
        ]);
        
        setAlleDispositionen(dispositionen);
        setAlleMitarbeiter(mitarbeiter);
        setAlleAuftraege(auftraege);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Daten konnten nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);


  // ========== FILTER & SEARCH ==========
  useEffect(() => {
    let gefilterte = alleDispositionen;

    if (suchbegriff) {
      gefilterte = gefilterte.filter(dispo =>
        (dispo.mitarbeiter_name?.toLowerCase().includes(suchbegriff.toLowerCase())) ||
        (dispo.auftragsname?.toLowerCase().includes(suchbegriff.toLowerCase()))
      );
    }

    setDispositionen(gefilterte);
  }, [suchbegriff, alleDispositionen]);


  // ========== FORM HANDLERS ==========
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNeuerTermin(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const resetForm = () => {
    setNeuerTermin({
      Mitarbeiter_id: '',
      Auftrag_id: '',
      Geplanter_Termin: '',
      Status: 'geplant',
      Notiz: ''
    });
    setShowNewTermin(false);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!neuerTermin.Mitarbeiter_id || !neuerTermin.Auftrag_id || !neuerTermin.Geplanter_Termin) {
      setError('Bitte füllen Sie alle erforderlichen Felder aus');
      return;
    }

    try {
      // WICHTIG: Disponent_id = Mitarbeiter_id (beide sind gleich)
      const payload = {
        Disponent_id: parseInt(neuerTermin.Mitarbeiter_id),
        Mitarbeiter_id: parseInt(neuerTermin.Mitarbeiter_id),
        Auftrag_id: parseInt(neuerTermin.Auftrag_id),
        Geplanter_Termin: neuerTermin.Geplanter_Termin,
        Status: neuerTermin.Status,
        Notiz: neuerTermin.Notiz
      };

      await apiCall(API_ENDPOINTS.disposition, 'POST', payload);

      // Daten neu laden
      const updatedDispositionen = await apiCall(API_ENDPOINTS.disposition);
      setAlleDispositionen(updatedDispositionen);

      resetForm();
      setError(null);
    } catch (err) {
      console.error('Failed to create disposition:', err);
      setError(`Fehler beim Erstellen: ${err.message}`);
    }
  };


  const handleDelete = async (disposition_id) => {
    if (!window.confirm('Diesen Termin wirklich löschen?')) return;

    try {
      await apiCall(API_ENDPOINTS.disposition + '?delete', 'POST', {
        Disposition_id: disposition_id
      });

      const updatedDispositionen = await apiCall(API_ENDPOINTS.disposition);
      setAlleDispositionen(updatedDispositionen);
      setError(null);
    } catch (err) {
      console.error('Failed to delete disposition:', err);
      setError(`Fehler beim Löschen: ${err.message}`);
    }
  };


  const handleStatusChange = async (disposition_id, newStatus) => {
    try {
      await apiCall(API_ENDPOINTS.disposition + '?update', 'POST', {
        Disposition_id: disposition_id,
        Status: newStatus
      });

      const updatedDispositionen = await apiCall(API_ENDPOINTS.disposition);
      setAlleDispositionen(updatedDispositionen);
      setError(null);
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(`Fehler beim Aktualisieren: ${err.message}`);
    }
  };


  // ========== HELPER FUNCTIONS ==========
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleDateString('de-CH', { 
        month: '2-digit', 
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Ungültiges Datum';
    }
  };

  const getInitials = (name) => {
    return (name?.charAt(0) || 'D').toUpperCase();
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
          <h1>Disposition</h1>
          <div className="disposition-stats">
            <span className="anzahl">{alleDispositionen.length}</span>
            <span className="label">Einträge</span>
          </div>
        </div>

        <div className="header-controls">
          <div className="suchleiste">
            <input
              type="text"
              placeholder="Dispositionen suchen..."
              value={suchbegriff}
              onChange={(e) => setSuchbegriff(e.target.value)}
              aria-label="Suche Dispositionen"
            />
          </div>
          <button
            className="neuer-termin-btn"
            onClick={() => setShowNewTermin(!showNewTermin)}
            aria-pressed={showNewTermin}
          >
            {showNewTermin ? 'Abbrechen' : '+ Neuer Termin'}
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            aria-label="Fehler schließen"
          >
            ✕
          </button>
        </div>
      )}

      {/* NEUER TERMIN FORM */}
      {showNewTermin && (
        <div className="neuer-termin-form-wrapper">
          <h3>Neuen Termin erstellen</h3>
          <form className="neuer-termin-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="mitarbeiter-select">Mitarbeiter *</label>
                <select
                  id="mitarbeiter-select"
                  name="Mitarbeiter_id"
                  value={neuerTermin.Mitarbeiter_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Mitarbeiter wählen --</option>
                  {alleMitarbeiter.map(m => (
                    <option key={m.mitarbeiter_id} value={m.mitarbeiter_id}>
                      {m.vorname} {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="auftrag-select">Auftrag *</label>
                <select
                  id="auftrag-select"
                  name="Auftrag_id"
                  value={neuerTermin.Auftrag_id}
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
              </div>

              <div className="form-group">
                <label htmlFor="termin-input">Geplanter Termin *</label>
                <input
                  id="termin-input"
                  name="Geplanter_Termin"
                  type="datetime-local"
                  value={neuerTermin.Geplanter_Termin}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="status-select">Status</label>
                <select
                  id="status-select"
                  name="Status"
                  value={neuerTermin.Status}
                  onChange={handleInputChange}
                >
                  <option value="geplant">Geplant</option>
                  <option value="in_arbeit">In Arbeit</option>
                  <option value="frei">Frei</option>
                  <option value="abgeschlossen">Abgeschlossen</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notiz-input">Notiz</label>
                <input
                  id="notiz-input"
                  name="Notiz"
                  placeholder="Notiz (optional)"
                  value={neuerTermin.Notiz}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowNewTermin(false)}
              >
                Abbrechen
              </button>
              <button type="submit" className="speichern-btn">
                Termin speichern
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DISPOSITIONEN TABELLE */}
      <div className="disposition-timeline">
        {loading ? (
          <div className="empty-state">
            <h3>Dispositionen werden geladen...</h3>
          </div>
        ) : dispositionen.length === 0 ? (
          <div className="empty-state">
            <h3>Keine Dispositionen gefunden</h3>
            <p>Versuche die Suche anzupassen oder erstelle einen neuen Termin</p>
          </div>

        ) : (

          <>
            <div className="timeline-header-dispo" style={{ color: 'black' }}>
              <div className='mitarbeiter-header'>
              <span>Mitarbeiter</span>
              </div>
              <div className='auftrag-header'>
              <span>Auftrag</span>
              </div>
              <div className='termin-header'>
              <span>Termin</span>
              </div>
              <div className='status-header'>
              <span>Status</span>
              </div>
              <span></span>
            </div>

            {dispositionen.map(dispo => (
              <div key={dispo.disposition_id} className="dispo-zeile">
                <div className="dispo-mitarbeiter">
                  <div className="avatar">{getInitials(dispo.mitarbeiter_name)}</div>
                  <span>{dispo.mitarbeiter_name || 'Unbekannt'}</span>
                </div>

                <div className="dispo-auftrag">
                  <p>{dispo.auftragsname || 'Unbekannt'}</p>
                  {dispo.notiz && <small>{dispo.notiz}</small>}
                </div>

                <div className="dispo-termin">
                  <span className="zeit">{formatDateTime(dispo.geplanter_termin)}</span>
                </div>

                <div className="dispo-status">
                  <select
                    className={`status-select status-${dispo.status}`}
                    value={dispo.status}
                    onChange={(e) => handleStatusChange(dispo.disposition_id, e.target.value)}
                    aria-label={`Status für ${dispo.mitarbeiter_name}`}
                  >
                    <option value="geplant">Geplant</option>
                    <option value="in_arbeit">In Arbeit</option>
                    <option value="frei">Frei</option>
                    <option value="abgeschlossen">Abgeschlossen</option>
                  </select>
                </div>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(dispo.disposition_id)}
                  title="Löschen"
                  aria-label={`Löschen: ${dispo.mitarbeiter_name} - ${dispo.auftragsname}`}
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


export default Disposition;
