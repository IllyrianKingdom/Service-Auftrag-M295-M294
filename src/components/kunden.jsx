import { useState } from 'react';
import { Link } from 'react-router-dom';
import './kunden.css';

function Kunden() {
  const [kunden, setKunden] = useState([
    { id: 1, name: 'Mustermann GmbH', branche: 'Bau', kontakt: 'Max M.', telefon: '044 123 45 67', status: 'Aktiv' },
    { id: 2, name: 'Schmidt Reparatur', branche: 'Werkstatt', kontakt: 'Anna S.', telefon: '044 987 65 43', status: 'Aktiv' },
    { id: 3, name: 'Meistermann GmbH', branche: 'Sanitär', kontakt: 'Peter W.', telefon: '044 555 11 22', status: 'Inaktiv' }
  ]);

  const [showNeuerKunde, setShowNeuerKunde] = useState(false);
  const [neuerKunde, setNeuerKunde] = useState({
    name: '',
    branche: '',
    kontakt: '',
    telefon: '',
    status: 'Aktiv'
  });

  const handleInputChange = (e) => {
    setNeuerKunde({ ...neuerKunde, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const kundeData = { id: Date.now(), ...neuerKunde };
    setKunden([kundeData, ...kunden]);
    setNeuerKunde({ name: '', branche: '', kontakt: '', telefon: '', status: 'Aktiv' });
    setShowNeuerKunde(false);
  };

  const handleDelete = (id) => {
    setKunden(kunden.filter((k) => k.id !== id));
  };

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
            <span className="anzahl">{kunden.length}</span>
            <span className="label">Kunden</span>
          </div>
        </div>

        <div className="header-controls">
          <button
            className="neuer-kunde-btn"
            onClick={() => setShowNeuerKunde(!showNeuerKunde)}
          >
            {showNeuerKunde ? 'Abbrechen' : '+ Neuer Kunde'}
          </button>
        </div>
      </div>

      {/* NEUER KUNDE FORM */}
      {showNeuerKunde && (
        <div className="neuer-termin-form-wrapper">
          <h3>Neuen Kunden anlegen</h3>
          <form className="neuer-termin-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <input
                name="name"
                placeholder="Firmenname"
                value={neuerKunde.name}
                onChange={handleInputChange}
                required
              />
              <input
                name="branche"
                placeholder="Branche"
                value={neuerKunde.branche}
                onChange={handleInputChange}
                required
              />
              <input
                name="kontakt"
                placeholder="Kontaktperson"
                value={neuerKunde.kontakt}
                onChange={handleInputChange}
              />
              <input
                name="telefon"
                placeholder="Telefon"
                value={neuerKunde.telefon}
                onChange={handleInputChange}
              />
              <select
                name="status"
                value={neuerKunde.status}
                onChange={handleInputChange}
              >
                <option>Aktiv</option>
                <option>Inaktiv</option>
              </select>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowNeuerKunde(false)}
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

      <div className="kunden-timeline">
        <div className="timeline-header">
          <span>Firmenname</span>
          <span>Branche</span>
          <span>Kontakt</span>
          <span>Telefon</span>
          <span>Status</span>
          <span></span>
        </div>

        {kunden.map((k) => (
          <div key={k.id} className="kunde-zeile">
            <div className="kunde-name">
              <div className="avatar">{k.name.charAt(0)}</div>
              <span>{k.name}</span>
            </div>
            <div className="kunde-branche">{k.branche}</div>
            <div className="kunde-kontakt">{k.kontakt}</div>
            <div className="kunde-telefon">{k.telefon}</div>
            <div className="kunde-status">
              <span className={`status-badge status-${k.status.toLowerCase()}`}>
                {k.status}
              </span>
            </div>
            <button
              className="delete-btn"
              onClick={() => handleDelete(k.id)}
            >
              
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Kunden;
