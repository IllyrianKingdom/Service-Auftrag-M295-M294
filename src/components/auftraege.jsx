import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Auftraege.css';
 
function Auftraege() {
  const [alleAuftraege, setAlleAuftraege] = useState([
    { id: 1, kunde: 'Mustermann GmbH', auftrag: 'Sanitär, disponiert', status: 'In Bearbeitung', datum: '17.12.' },
    { id: 2, kunde: 'Meistermann GmbH', auftrag: 'Heizung, disponiert', status: 'Abgeschlossen', datum: '17.12.' },
    { id: 3, kunde: 'Schmidt Reparatur', auftrag: 'Offen', status: 'Neu', datum: '17.12.' }
  ]);
 
  const [auftraege, setAuftraege] = useState(alleAuftraege);
  const [neuerAuftrag, setNeuerAuftrag] = useState({ kunde: '', auftrag: '', status: 'Neu', datum: '' });
  const [showForm, setShowForm] = useState(false);
  const [suchbegriff, setSuchbegriff] = useState('');
  const [filterStatus, setFilterStatus] = useState('alle');
 
  // Filter & Suche
  useEffect(() => {
    let gefilterte = alleAuftraege;
 
    // Status Filter
    if (filterStatus !== 'alle') {
      gefilterte = gefilterte.filter(auftrag => auftrag.status === filterStatus);
    }
 
    // Suche
    if (suchbegriff) {
      gefilterte = gefilterte.filter(auftrag =>
        auftrag.kunde.toLowerCase().includes(suchbegriff.toLowerCase()) ||
        auftrag.auftrag.toLowerCase().includes(suchbegriff.toLowerCase())
      );
    }
 
    setAuftraege(gefilterte);
  }, [suchbegriff, filterStatus, alleAuftraege]);
 
  const handleInputChange = (e) => {
    setNeuerAuftrag({ ...neuerAuftrag, [e.target.name]: e.target.value });
  };
 
  const handleSubmit = (e) => {
    e.preventDefault();
    const auftragData = {
      id: Date.now(),
      ...neuerAuftrag,
      datum: neuerAuftrag.datum || new Date().toISOString().split('T')[0].slice(-5)
    };
    setAlleAuftraege([auftragData, ...alleAuftraege]);
    setNeuerAuftrag({ kunde: '', auftrag: '', status: 'Neu', datum: '' });
    setShowForm(false);
  };
 
  const handleDelete = (id) => {
    setAlleAuftraege(alleAuftraege.filter(auftrag => auftrag.id !== id));
  };
 
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
              <option value="Neu">Neu</option>
              <option value="In Bearbeitung">In Bearbeitung</option>
              <option value="Abgeschlossen">Abgeschlossen</option>
            </select>
          </div>
          <button className="neu-auftrag-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Abbrechen' : 'Neuer Auftrag +'}
          </button>
        </div>
      </div>
 
      {showForm && (
        <div className="auftrag-form-container">
          <form className="auftrag-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                name="kunde"
                placeholder="Kunde"
                value={neuerAuftrag.kunde}
                onChange={handleInputChange}
                required
              />
              <input
                name="auftrag"
                placeholder="Auftrag"
                value={neuerAuftrag.auftrag}
                onChange={handleInputChange}
                required
              />
              <select name="status" value={neuerAuftrag.status} onChange={handleInputChange} className="custom-select">
                <option>Neu</option>
                <option>In Bearbeitung</option>
                <option>Abgeschlossen</option>
              </select>
              <input
                name="datum"
                type="date"
                value={neuerAuftrag.datum}
                onChange={handleInputChange}
              />
            </div>
            <button type="submit">Auftrag erstellen</button>
          </form>
        </div>
      )}
 
      {/* AUFTRÄGE KARTEN */}
      <div className="auftraege-karten">
        {auftraege.length === 0 ? (
          <div className="empty-state">
            <h3>Keine Aufträge gefunden</h3>
            <p>Versuche die Suche anzupassen oder erstelle einen neuen Auftrag</p>
          </div>
        ) : (
          auftraege.map(auftrag => (
            <div key={auftrag.id} className="auftrag-karte">
              <div className="karte-header">
                <h3>{auftrag.kunde}</h3>
                <button className="delete-btn" onClick={() => handleDelete(auftrag.id)}>
                  ×
                </button>
              </div>
              <div className="karte-body">
                <p>{auftrag.auftrag}</p>
                <div className="karte-footer">
                  <span className={`status-badge status-${auftrag.status.toLowerCase().replace(/ /g, '-')}`}>
                    {auftrag.status}
                  </span>
                  <span className="datum">{auftrag.datum}</span>
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