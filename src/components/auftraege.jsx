import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS, apiCall } from '../services/api.jsx';
import './auftraege.css';



// ========== CUSTOM HOOKS ==========
const useAuftraegeData = () => {
  const [alleAuftraege, setAlleAuftraege] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



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



  useEffect(() => {
    fetchAuftraege();
  }, []);



  return { alleAuftraege, loading, error, setError, fetchAuftraege };
};



const useAlleKunden = () => {
  const [kunden, setKunden] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchKunden = async () => {
      try {
        setLoading(true);
        const response = await apiCall(API_ENDPOINTS.kunden);
        setKunden(response);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch kunden:', err);
        setError('Kunden konnten nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };

    fetchKunden();
  }, []);

  return { kunden, loading, error };
};



const useFilteredAuftraege = (alleAuftraege, suchbegriff, filterStatus) => {
  const [auftraege, setAuftraege] = useState([]);



  useEffect(() => {
    let gefilterte = alleAuftraege;



    if (filterStatus !== 'alle') {
      gefilterte = gefilterte.filter(a => a.status === filterStatus);
    }



    if (suchbegriff) {
      const suchLower = suchbegriff.toLowerCase();
      gefilterte = gefilterte.filter(a =>
        a.auftragsname.toLowerCase().includes(suchLower) ||
        a.firma?.toLowerCase().includes(suchLower) ||
        `${a.vorname} ${a.name}`.toLowerCase().includes(suchLower)
      );
    }



    setAuftraege(gefilterte);
  }, [suchbegriff, filterStatus, alleAuftraege]);



  return auftraege;
};



const getKundenName = (auftrag) => {
  // Priorität: Firma > Vorname + Name
  if (auftrag.firma) {
    return `${auftrag.firma} (${auftrag.vorname} ${auftrag.name})`.trim();
  }
  return `${auftrag.vorname} ${auftrag.name}`.trim();
};


const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString + 'T00:00:00Z');
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('de-CH', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  } catch {
    return dateString;
  }
};



const createEmptyAuftrag = () => ({
  Kunden_id: '',
  Auftragsname: '',
  Status: 'erfasst',
  Angefangen_am: ''
});



// ========== SUB-COMPONENTS ==========
const AuftraegeHeader = ({ count, suchbegriff, setSuchbegriff, filterStatus, setFilterStatus, showForm, setShowForm }) => (
  <div className="auftraege-header">
    <div className="header-left">
      <Link to="/dashboard" className="back-btn">← Dashboard</Link>
      <h1>Aufträge</h1>
      <div className="auftraege-anzahl">
        <span className="anzahl">{count}</span>
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
);



const ErrorBanner = ({ error, onClose }) => (
  error && (
    <div className="error-banner">
      <span>{error}</span>
      <button onClick={onClose}>✕</button>
    </div>
  )
);



const AuftraegeFormComponent = ({ neuerAuftrag, setNeuerAuftrag, alleKunden, onSubmit }) => {
  const getKundenDisplayName = (kunde) => {
    if (kunde.firma) {
      return `${kunde.firma} (${kunde.vorname} ${kunde.name})`.trim();
    }
    return `${kunde.vorname} ${kunde.name}`.trim();
  };

  return (
    <div className="auftrag-form-container">
      <form className="auftrag-form" onSubmit={onSubmit}>
        <div className="form-row">
          <select
            name="Kunden_id"
            value={neuerAuftrag.Kunden_id}
            onChange={(e) => setNeuerAuftrag(prev => ({ ...prev, Kunden_id: e.target.value }))}
            className="custom-select"
            required
          >
            <option value="">-- Kunde wählen --</option>
            {alleKunden.map(kunde => (
              <option key={kunde.kunden_id} value={kunde.kunden_id}>
                {getKundenDisplayName(kunde)}
              </option>
            ))}
          </select>
          <input
            name="Auftragsname"
            placeholder="Auftragsname"
            value={neuerAuftrag.Auftragsname}
            onChange={(e) => setNeuerAuftrag(prev => ({ ...prev, Auftragsname: e.target.value }))}
            required
          />
          <select
            name="Status"
            value={neuerAuftrag.Status}
            onChange={(e) => setNeuerAuftrag(prev => ({ ...prev, Status: e.target.value }))}
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
            onChange={(e) => setNeuerAuftrag(prev => ({ ...prev, Angefangen_am: e.target.value }))}
          />
        </div>
        <button type="submit">Auftrag erstellen</button>
      </form>
    </div>
  );
};


const AuftragKarte = ({ auftrag, onDelete, onStatusChange }) => (
  <div className="auftrag-karte">
    <div className="karte-header">
      <h3>{auftrag.auftragsname}</h3>
      <button
        className="delete-btn"
        onClick={() => onDelete(auftrag.auftrag_id)}
        title="Löschen"
      >
        ×
      </button>
    </div>
    <div className="karte-body">
      <p className="kundenname">{getKundenName(auftrag)}</p>
      <div className="karte-footer">
        <select
          className={`status-select status-${auftrag.status}`}
          value={auftrag.status}
          onChange={(e) => onStatusChange(auftrag.auftrag_id, e.target.value)}
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
);



const AuftraegeGrid = ({ auftraege, loading, onDelete, onStatusChange }) => (
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
        <AuftragKarte
          key={auftrag.auftrag_id}
          auftrag={auftrag}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      ))
    )}
  </div>
);



// ========== MAIN COMPONENT ==========
function Auftraege() {
  // States
  const { alleAuftraege, loading, error, setError, fetchAuftraege } = useAuftraegeData();
  const { kunden: alleKunden } = useAlleKunden();
  const [suchbegriff, setSuchbegriff] = useState('');
  const [filterStatus, setFilterStatus] = useState('alle');
  const [showForm, setShowForm] = useState(false);
  const [neuerAuftrag, setNeuerAuftrag] = useState(createEmptyAuftrag());
  const auftraege = useFilteredAuftraege(alleAuftraege, suchbegriff, filterStatus);



  // Handlers
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
        Angefangen_am: neuerAuftrag.Angefangen_am || new Date().toISOString().split('T')[0]
      };



      await apiCall(API_ENDPOINTS.auftraege, 'POST', payload);
      await fetchAuftraege();
      setNeuerAuftrag(createEmptyAuftrag());
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
      const payload = {
        Auftrag_id: auftrag_id,
        Status: newStatus,
        Erledigt_am: (newStatus === 'verrechnet') ? new Date().toISOString().split('T')[0] : null
      };
      
      await apiCall(API_ENDPOINTS.auftraege + '?update', 'POST', payload);
      await fetchAuftraege();
      setError(null);
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(`Fehler: ${err.message}`);
    }
  };



  return (
    <div className="auftraege-fullscreen">
      <AuftraegeHeader
        count={alleAuftraege.length}
        suchbegriff={suchbegriff}
        setSuchbegriff={setSuchbegriff}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        showForm={showForm}
        setShowForm={setShowForm}
      />



      <ErrorBanner error={error} onClose={() => setError(null)} />



      {showForm && (
        <AuftraegeFormComponent
          neuerAuftrag={neuerAuftrag}
          setNeuerAuftrag={setNeuerAuftrag}
          alleKunden={alleKunden}
          onSubmit={handleSubmit}
        />
      )}



      <AuftraegeGrid
        auftraege={auftraege}
        loading={loading}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}



export default Auftraege;