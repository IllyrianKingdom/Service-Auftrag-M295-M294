import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './berichte.css';

function Berichte() {
  const [berichte] = useState([
    { id: 1, typ: 'Aufträge', titel: 'Offene Aufträge', beschreibung: 'Übersicht aller offenen Aufträge nach Kunde und Priorität.', zeitraum: 'Januar 2026', anzahl: 12 },
    { id: 2, typ: 'Disposition', titel: 'Auslastung Mitarbeiter', beschreibung: 'Geplante Einsätze pro Mitarbeiter für diese Woche.', zeitraum: 'KW 04 / 2026', anzahl: 7 },
    { id: 3, typ: 'Finanzen', titel: 'Verrechnete Aufträge', beschreibung: 'Abgeschlossene und verrechnete Aufträge mit Umsatz.', zeitraum: 'Q4 2025', anzahl: 23 },
    { id: 4, typ: 'Aufträge', titel: 'Reklamationen', beschreibung: 'Aufträge mit gemeldeten Problemen oder Nacharbeit.', zeitraum: 'Letzte 3 Monate', anzahl: 3 },
  ]);

  const [filterTyp, setFilterTyp] = useState('alle');
  const [suchbegriff, setSuchbegriff] = useState('');

  const gefilterteBerichte = useMemo(() => {
    return berichte.filter((b) => {
      const typOk = filterTyp === 'alle' || b.typ === filterTyp;
      const suchOk =
        !suchbegriff ||
        b.titel.toLowerCase().includes(suchbegriff.toLowerCase()) ||
        b.beschreibung.toLowerCase().includes(suchbegriff.toLowerCase());
      return typOk && suchOk;
    });
  }, [berichte, filterTyp, suchbegriff]);

  return (
    <div className="berichte-fullscreen">
      {/* Header */}
      <div className="berichte-header">
        <div className="header-left">
          <Link to="/dashboard" className="back-btn">
            ← Dashboard
          </Link>
          <h1>Berichte</h1>
          <div className="berichte-stats">
            <span className="anzahl">{berichte.length}</span>
            <span className="label">Vorlagen</span>
          </div>
        </div>

        <div className="header-controls">
          <div className="berichte-suche">
            <input
              type="text"
              placeholder="Berichte durchsuchen..."
              value={suchbegriff}
              onChange={(e) => setSuchbegriff(e.target.value)}
            />
          </div>
          <div className="berichte-filter">
            <select
              value={filterTyp}
              onChange={(e) => setFilterTyp(e.target.value)}
            >
              <option value="alle">Alle Kategorien</option>
              <option value="Aufträge">Aufträge</option>
              <option value="Disposition">Disposition</option>
              <option value="Finanzen">Finanzen</option>
            </select>
          </div>
          <button className="export-btn">Exportieren</button>
        </div>
      </div>

      {/* Hauptbereich: Karten + Detailpanel */}
      <div className="berichte-layout">
        <div className="berichte-liste">
          {gefilterteBerichte.length === 0 ? (
            <div className="empty-state">
              <h3>Keine Berichte gefunden</h3>
              <p>Filter oder Suchbegriff anpassen, um mehr Berichte zu sehen.</p>
            </div>
          ) : (
            gefilterteBerichte.map((bericht) => (
              <div key={bericht.id} className="bericht-karte">
                <div className="bericht-header-row">
                  <span className={`typ-badge typ-${bericht.typ.toLowerCase()}`}>
                    {bericht.typ}
                  </span>
                  <span className="bericht-anzahl">{bericht.anzahl} Einträge</span>
                </div>
                <h3>{bericht.titel}</h3>
                <p className="bericht-beschreibung">{bericht.beschreibung}</p>
                <div className="bericht-footer-row">
                  <span className="zeitraum">{bericht.zeitraum}</span>
                  <button className="anzeigen-btn">
                    Bericht anzeigen
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <aside className="berichte-detail">
          <h2>Berichtsübersicht</h2>
          <p>
            Wähle links einen Bericht aus, um ihn zu öffnen oder zu exportieren.
            Später kannst du hier echte Daten aus PostgreSQL/PHP einbinden
            (z.&nbsp;B. als PDF, Tabelle oder Diagramm).
          </p>

          <div className="berichte-summary-cards">
            <div className="summary-card">
              <span className="summary-label">Auftragsberichte</span>
              <span className="summary-value">
                {berichte.filter(b => b.typ === 'Aufträge').length}
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Disposition</span>
              <span className="summary-value">
                {berichte.filter(b => b.typ === 'Disposition').length}
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Finanzen</span>
              <span className="summary-value">
                {berichte.filter(b => b.typ === 'Finanzen').length}
              </span>
            </div>
          </div>

          <div className="hinweis-box">
            <h4>Integration mit Backend</h4>
            <p>
              Hier kannst du später deine Berichte über eine API laden, die in
              PHP die Daten aus PostgreSQL holt. Die React-Komponente bleibt
              gleich, nur die Datenquelle ändert sich.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Berichte;
