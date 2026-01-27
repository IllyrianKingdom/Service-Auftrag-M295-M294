import { useState } from 'react';
import { Link } from 'react-router-dom';
import './disposition.css';

function Disposition() {
  const [dispositionen, setDispositionen] = useState([
    { id: 1, kunde: 'Mustermann GmbH', auftrag: 'Sanitär Installation', mitarbeiter: 'Max M.', termin: '25.01. 08:00', status: 'Geplant' },
    { id: 2, kunde: 'Schmidt Reparatur', auftrag: 'Heizung Reparatur', mitarbeiter: 'Anna S.', termin: '25.01. 10:00', status: 'In Arbeit' },
    { id: 3, kunde: 'Meistermann GmbH', auftrag: 'Badumbau', mitarbeiter: 'Peter W.', termin: '26.01. 09:00', status: 'Frei' }
  ]);

  const [showNewTermin, setShowNewTermin] = useState(false);
  const [neuerTermin, setNeuerTermin] = useState({
    kunde: '',
    auftrag: '',
    mitarbeiter: '',
    termin: '',
    status: 'Geplant'
  });

  const mitarbeiterListe = ['Max M.', 'Anna S.', 'Peter W.', 'Lisa K.', 'Tom B.'];

  const handleInputChange = (e) => {
    setNeuerTermin({ ...neuerTermin, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const terminData = {
      id: Date.now(),
      ...neuerTermin,
      termin:
        neuerTermin.termin ||
        `${new Date().getDate() + 1}.${new Date().getMonth() + 1}. 09:00`
    };

    // neuer Termin oben einfügen
    setDispositionen([terminData, ...dispositionen]);
    setNeuerTermin({
      kunde: '',
      auftrag: '',
      mitarbeiter: '',
      termin: '',
      status: 'Geplant'
    });
    setShowNewTermin(false);
  };

  const handleDelete = (id) => {
    setDispositionen(dispositionen.filter((d) => d.id !== id));
  };

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
            <span className="anzahl">{dispositionen.length}</span>
            <span className="label">Einträge</span>
          </div>
        </div>

        <div className="header-controls">
          <button
            className="neuer-termin-btn"
            onClick={() => setShowNewTermin(!showNewTermin)}
          >
            {showNewTermin ? 'Abbrechen' : '+ Neuer Termin'}
          </button>
        </div>
      </div>

      {/* NEUER TERMIN FORM – schicke Box, nicht ganzes Overlay */}
      {showNewTermin && (
        <div className="neuer-termin-form-wrapper">
          <h3>Neuen Termin erstellen</h3>
          <form className="neuer-termin-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <input
                name="kunde"
                placeholder="Kunde"
                value={neuerTermin.kunde}
                onChange={handleInputChange}
                required
              />
              <input
                name="auftrag"
                placeholder="Auftrag"
                value={neuerTermin.auftrag}
                onChange={handleInputChange}
                required
              />
              <select
                name="mitarbeiter"
                value={neuerTermin.mitarbeiter}
                onChange={handleInputChange}
                required
              >
                <option value="">Mitarbeiter wählen</option>
                {mitarbeiterListe.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                name="termin"
                type="datetime-local"
                value={neuerTermin.termin}
                onChange={handleInputChange}
              />
              <select
                name="status"
                value={neuerTermin.status}
                onChange={handleInputChange}
              >
                <option>Geplant</option>
                <option>In Arbeit</option>
                <option>Frei</option>
                <option>Abgeschlossen</option>
              </select>
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

      <div className="disposition-timeline">
        <div className="timeline-header">
          <span>Mitarbeiter</span>
          <span>Auftrag</span>
          <span>Termin</span>
          <span>Status</span>
          <span></span>
        </div>

        {dispositionen.map((dispo) => (
          <div key={dispo.id} className="dispo-zeile">
            <div className="dispo-mitarbeiter">
              <div className="avatar">{dispo.mitarbeiter.charAt(0)}</div>
              <span>{dispo.mitarbeiter}</span>
            </div>
            <div className="dispo-auftrag">
              <h4>{dispo.kunde}</h4>
              <p>{dispo.auftrag}</p>
            </div>
            <div className="dispo-termin">
              <span className="zeit">{dispo.termin}</span>
            </div>
            <div className="dispo-status">
              <span
                className={`status-badge status-${dispo.status
                  .toLowerCase()
                  .replace(/ /g, '-')}`}
              >
                {dispo.status}
              </span>
            </div>
            <button
              className="delete-btn"
              onClick={() => handleDelete(dispo.id)}
            >
              
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Disposition;
