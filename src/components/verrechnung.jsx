import { useState } from 'react';
import { Link } from 'react-router-dom';
import './verrechnung.css';

function Verrechnungen() {
  const [verrechnungen, setVerrechnungen] = useState([
    { id: 1, kunde: 'Mustermann GmbH', auftrag: 'Sanitär Installation', betrag: '2.450,00 €', status: 'Offen' },
    { id: 2, kunde: 'Schmidt Reparatur', auftrag: 'Heizung Reparatur', betrag: '1.280,00 €', status: 'Bezahlt' },
    { id: 3, kunde: 'Meistermann GmbH', auftrag: 'Badumbau', betrag: '8.950,00 €', status: 'Offen' }
  ]);

  const [showNeueRechnung, setShowNeueRechnung] = useState(false);
  const [neueRechnung, setNeueRechnung] = useState({
    kunde: '',
    auftrag: '',
    betrag: '',
    status: 'Offen'
  });

  const handleInputChange = (e) => {
    setNeueRechnung({ ...neueRechnung, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rechnungData = {
      id: Date.now(),
      ...neueRechnung
    };
    setVerrechnungen([rechnungData, ...verrechnungen]);
    setNeueRechnung({ kunde: '', auftrag: '', betrag: '', status: 'Offen' });
    setShowNeueRechnung(false);
  };

  const handleDelete = (id) => {
    setVerrechnungen(verrechnungen.filter((v) => v.id !== id));
  };

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
            <span className="anzahl">{verrechnungen.length}</span>
            <span className="label">Rechnungen</span>
          </div>
        </div>

        <div className="header-controls">
          <button
            className="neue-rechnung-btn"
            onClick={() => setShowNeueRechnung(!showNeueRechnung)}
          >
            {showNeueRechnung ? 'Abbrechen' : '+ Neue Rechnung'}
          </button>
        </div>
      </div>

      {/* NEUE RECHNUNG FORM */}
      {showNeueRechnung && (
        <div className="neuer-termin-form-wrapper">
          <h3>Neue Rechnung erstellen</h3>
          <form className="neuer-termin-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <input
                name="kunde"
                placeholder="Kunde"
                value={neueRechnung.kunde}
                onChange={handleInputChange}
                required
              />
              <input
                name="auftrag"
                placeholder="Auftrag"
                value={neueRechnung.auftrag}
                onChange={handleInputChange}
                required
              />
              <input
                name="betrag"
                placeholder="Betrag"
                value={neueRechnung.betrag}
                onChange={handleInputChange}
                required
              />
              <select
                name="status"
                value={neueRechnung.status}
                onChange={handleInputChange}
              >
                <option>Offen</option>
                <option>Bezahlt</option>
                <option>Überfällig</option>
              </select>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowNeueRechnung(false)}
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
        <div className="timeline-header">
          <span>Kunde</span>
          <span>Auftrag</span>
          <span>Betrag</span>
          <span>Status</span>
          <span></span>
        </div>

        {verrechnungen.map((v) => (
          <div key={v.id} className="verr-zeile">
            <div className="verr-kunde">
              <div className="avatar">{v.kunde.charAt(0)}</div>
              <span>{v.kunde}</span>
            </div>
            <div className="verr-auftrag">
              <h4>{v.auftrag}</h4>
            </div>
            <div className="verr-betrag">{v.betrag}</div>
            <div className="verr-status">
              <span
                className={`status-badge status-${v.status
                  .toLowerCase()
                  .replace(/ /g, '-')}`}
              >
                {v.status}
              </span>
            </div>
            <button
              className="delete-btn"
              onClick={() => handleDelete(v.id)}
            >
              
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Verrechnungen;
