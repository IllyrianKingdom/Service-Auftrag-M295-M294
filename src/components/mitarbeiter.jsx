import { useState } from 'react';
import { Link } from 'react-router-dom';
import './mitarbeiter.css';

function Mitarbeiter() {
  const [mitarbeiter, setMitarbeiter] = useState([
    { id: 1, name: 'Max Mustermann', rolle: 'Installateur', status: 'Aktiv', telefon: '079 123 45 67' },
    { id: 2, name: 'Anna Schmidt', rolle: 'Elektrikerin', status: 'Urlaub', telefon: '079 987 65 43' },
    { id: 3, name: 'Tom Becker', rolle: 'Heizungsbauer', status: 'Aktiv', telefon: '079 555 11 22' }
  ]);

  const [showNeuerMitarbeiter, setShowNeuerMitarbeiter] = useState(false);
  const [neuerMitarbeiter, setNeuerMitarbeiter] = useState({
    name: '',
    rolle: '',
    status: 'Aktiv',
    telefon: '',
  });

  const handleInputChange = (e) => {
    setNeuerMitarbeiter({ ...neuerMitarbeiter, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const neuerEintrag = {
      id: Date.now(),
      ...neuerMitarbeiter,
    };
    setMitarbeiter([neuerEintrag, ...mitarbeiter]);
    setNeuerMitarbeiter({ name: '', rolle: '', status: 'Aktiv', telefon: '' });
    setShowNeuerMitarbeiter(false);
  };

  const handleDelete = (id) => {
    setMitarbeiter(mitarbeiter.filter((m) => m.id !== id));
  };

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
            <span className="anzahl">{mitarbeiter.length}</span>
            <span className="label">Mitarbeiter</span>
          </div>
        </div>

        <div className="header-controls">
          <button
            className="neuer-termin-btn"
            onClick={() => setShowNeuerMitarbeiter(!showNeuerMitarbeiter)}
          >
            {showNeuerMitarbeiter ? 'Abbrechen' : '+ Neuer Mitarbeiter'}
          </button>
        </div>
      </div>

      {/* NEUER MITARBEITER FORM */}
      {showNeuerMitarbeiter && (
        <div className="neuer-termin-form-wrapper">
          <h3>Neuen Mitarbeiter hinzufügen</h3>
          <form className="neuer-termin-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <input
                name="name"
                placeholder="Name"
                value={neuerMitarbeiter.name}
                onChange={handleInputChange}
                required
              />
              <input
                name="rolle"
                placeholder="Rolle/Funktion"
                value={neuerMitarbeiter.rolle}
                onChange={handleInputChange}
                required
              />
              <select
                name="status"
                value={neuerMitarbeiter.status}
                onChange={handleInputChange}
              >
                <option>Aktiv</option>
                <option>Urlaub</option>
                <option>Inaktiv</option>
              </select>
              <input
                name="telefon"
                placeholder="Telefonnummer"
                value={neuerMitarbeiter.telefon}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowNeuerMitarbeiter(false)}>
                Abbrechen
              </button>
              <button type="submit" className="speichern-btn">
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTE */}
      <div className="disposition-timeline">
        <div className="timeline-header">
          <span>Name</span>
          <span>Rolle</span>
          <span>Status</span>
          <span>Telefon</span>
          <span></span>
        </div>

        {mitarbeiter.map((m) => (
          <div key={m.id} className="dispo-zeile">
            <div className="dispo-mitarbeiter">
              <div className="avatar">{m.name.charAt(0)}</div>
              <span>{m.name}</span>
            </div>
            <div className="dispo-auftrag">
              <h4>{m.rolle}</h4>
            </div>
            <div className="dispo-status">
              <span className={`status-badge status-${m.status.toLowerCase()}`}>
                {m.status}
              </span>
            </div>
            <div className="dispo-termin">
              <span className="zeit">{m.telefon}</span>
            </div>
            <button className="delete-btn" onClick={() => handleDelete(m.id)}></button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Mitarbeiter;
