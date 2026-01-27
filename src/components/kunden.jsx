import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS, apiCall } from '../services/api.jsx';
import './kunden.css';

function Kunden() {
  // ========== STATE ==========
  const [alleKunden, setAlleKunden] = useState([]);
  const [kunden, setKunden] = useState([]);
  const [neuerKunde, setNeuerKunde] = useState({
    Vorname: '',
    Name: '',
    Firma: '',
    Addresse: '',
    PLZ: '',
    Ort: '',
    Telefonnummer: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [suchbegriff, setSuchbegriff] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ========== FETCH KUNDEN ==========
  useEffect(() => {
    fetchKunden();
  }, []);

  const fetchKunden = async () => {
    try {
      setLoading(true);
      const response = await apiCall(API_ENDPOINTS.kunden);
      setAlleKunden(response);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch kunden:', err);
      setError('Kunden konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  // ========== FILTER & SEARCH ==========
  useEffect(() => {
    let gefilterte = alleKunden;

    // Suche (nach Firma oder Name) - snake_case!
    if (suchbegriff) {
      gefilterte = gefilterte.filter(kunde =>
        (kunde.firma && kunde.firma.toLowerCase().includes(suchbegriff.toLowerCase())) ||
        (kunde.name && kunde.name.toLowerCase().includes(suchbegriff.toLowerCase())) ||
        (kunde.vorname && kunde.vorname.toLowerCase().includes(suchbegriff.toLowerCase()))
      );
    }

    setKunden(gefilterte);
  }, [suchbegriff, alleKunden]);

  // ========== FORM HANDLERS ==========
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNeuerKunde(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!neuerKunde.Name || !neuerKunde.Firma) {
      setError('Bitte füllen Sie alle erforderlichen Felder aus (Name, Firma)');
      return;
    }

    try {
      const payload = {
        Vorname: neuerKunde.Vorname,
        Name: neuerKunde.Name,
        Firma: neuerKunde.Firma,
        Addresse: neuerKunde.Addresse,
        PLZ: neuerKunde.PLZ,
        Ort: neuerKunde.Ort,
        Telefonnummer: neuerKunde.Telefonnummer
      };

      await apiCall(API_ENDPOINTS.kunden, 'POST', payload);

      await fetchKunden();

      setNeuerKunde({
        Vorname: '',
        Name: '',
        Firma: '',
        Addresse: '',
        PLZ: '',
        Ort: '',
        Telefonnummer: ''
      });
      setShowForm(false);
      setError(null);
    } catch (err) {
      console.error('Failed to create kunde:', err);
      setError(`Fehler: ${err.message}`);
    }
  };

  const handleDelete = async (kunden_id) => {
    if (!window.confirm('Diesen Kunden wirklich löschen?')) return;

    try {
      await apiCall(API_ENDPOINTS.kunden + '?delete', 'POST', {
        Kunden_id: kunden_id
      });

      await fetchKunden();
      setError(null);
    } catch (err) {
      console.error('Failed to delete kunde:', err);
      setError(`Fehler: ${err.message}`);
    }
  };

  // ========== RENDER ==========
  return (
    <div className="kunden-fullscreen">
      {/* HEADER */}
      <div className="kunden-header">
        <div className="header-left">
          <Link to="/dashboard" className="back-btn">
            ← Dashboard
          </Link>
          <h1>Kundenverwaltung</h1>
          <div className="kunden-stats">
            <span className="anzahl">{alleKunden.length}</span>
            <span className="label">Kunden</span>
          </div>
        </div>

        <div className="header-controls">
          <div className="suchleiste">
            <input
              type="text"
              placeholder="Kunden suchen..."
              value={suchbegriff}
              onChange={(e) => setSuchbegriff(e.target.value)}
            />
          </div>
          <button
            className="neuer-kunde-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Abbrechen' : '+ Neuer Kunde'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* NEUER KUNDE FORM */}
      {showForm && (
        <div className="neuer-termin-form-wrapper">
          <h3>Neuen Kunden anlegen</h3>
          <form className="neuer-termin-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <input
                name="Vorname"
                placeholder="Vorname"
                value={neuerKunde.Vorname}
                onChange={handleInputChange}
              />
              <input
                name="Name"
                placeholder="Name *"
                value={neuerKunde.Name}
                onChange={handleInputChange}
                required
              />
              <input
                name="Firma"
                placeholder="Firma *"
                value={neuerKunde.Firma}
                onChange={handleInputChange}
                required
              />
              <input
                name="Addresse"
                placeholder="Addresse"
                value={neuerKunde.Addresse}
                onChange={handleInputChange}
              />
              <input
                name="PLZ"
                placeholder="PLZ"
                value={neuerKunde.PLZ}
                onChange={handleInputChange}
              />
              <input
                name="Ort"
                placeholder="Ort"
                value={neuerKunde.Ort}
                onChange={handleInputChange}
              />
              <input
                name="Telefonnummer"
                placeholder="Telefonnummer"
                value={neuerKunde.Telefonnummer}
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
                Kunde speichern
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KUNDEN TABELLE */}
      <div className="kunden-timeline">
        {loading ? (
          <div className="empty-state">
            <h3>Kunden werden geladen...</h3>
          </div>
        ) : kunden.length === 0 ? (
          <div className="empty-state">
            <h3>Keine Kunden gefunden</h3>
            <p>Versuche die Suche anzupassen oder erstelle einen neuen Kunden</p>
          </div>
        ) : (
          <>
            <div className="timeline-header">
              <span>Firma</span>
              <span>Name</span>
              <span>Addresse</span>
              <span>PLZ / Ort</span>
              <span>Telefon</span>
              <span></span>
            </div>

            {kunden.map(kunde => (
              <div key={kunde.kunden_id} className="kunde-zeile">
                <div className="kunde-firma">
                  <div className="avatar">{kunde.firma?.charAt(0) || 'K'}</div>
                  <span>{kunde.firma || 'Keine Firma'}</span>
                </div>
                <div className="kunde-name">
                  {kunde.vorname && <span>{kunde.vorname}</span>}
                  <span>{kunde.name}</span>
                </div>
                <div className="kunde-addresse">{kunde.addresse || '-'}</div>
                <div className="kunde-ort">
                  {kunde.plz} {kunde.ort}
                </div>
                <div className="kunde-telefon">{kunde.telefonnummer || '-'}</div>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(kunde.kunden_id)}
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

export default Kunden;