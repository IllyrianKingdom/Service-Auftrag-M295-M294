import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './berichte.css';

function Berichte() {
  const [berichte, setBerichte] = useState([
    { id: 1, typ: 'Aufträge', titel: 'Offene Aufträge', beschreibung: 'Übersicht aller offenen Aufträge nach Kunde und Priorität.', zeitraum: 'Januar 2026', anzahl: 12 },
    { id: 2, typ: 'Disposition', titel: 'Auslastung Mitarbeiter', beschreibung: 'Geplante Einsätze pro Mitarbeiter für diese Woche.', zeitraum: 'KW 04 / 2026', anzahl: 7 },
    { id: 3, typ: 'Finanzen', titel: 'Verrechnete Aufträge', beschreibung: 'Abgeschlossene und verrechnete Aufträge mit Umsatz.', zeitraum: 'Q4 2025', anzahl: 23 },
    { id: 4, typ: 'Aufträge', titel: 'Reklamationen', beschreibung: 'Aufträge mit gemeldeten Problemen oder Nacharbeit.', zeitraum: 'Letzte 3 Monate', anzahl: 3 },
  ]);

  // Mock-Daten für Auswahl (später von PHP)
  const [auftraege, setAuftraege] = useState([
    { id: 1, kunde: 'Mustermann GmbH', aufgabe: 'Sanitär Installation', termin: '25.01. 08:00' },
    { id: 2, kunde: 'Schmidt Reparatur', aufgabe: 'Heizung Reparatur', termin: '25.01. 10:00' },
    { id: 3, kunde: 'Meistermann GmbH', aufgabe: 'Badumbau', termin: '26.01. 09:00' }
  ]);

  const [mitarbeiter, setMitarbeiter] = useState([
    { id: 1, name: 'Max Mustermann' },
    { id: 2, name: 'Anna Schmidt' }
  ]);

  const [verrechnungen, setVerrechnungen] = useState([
    { id: 1, kunde: 'Mustermann GmbH', betrag: '2.450,00 €' }
  ]);

  const [filterTyp, setFilterTyp] = useState('alle');
  const [suchbegriff, setSuchbegriff] = useState('');
  const [showNeuerBericht, setShowNeuerBericht] = useState(false);
  const [neuerBericht, setNeuerBericht] = useState({
    typ: '', titel: '', beschreibung: '', zeitraum: '', anzahl: '', auftragId: ''
  });
  const [selectedBericht, setSelectedBericht] = useState(null);

  const gefilterteBerichte = useMemo(() => {
    return berichte.filter((b) => {
      const typOk = filterTyp === 'alle' || b.typ === filterTyp;
      const suchOk = !suchbegriff || 
        b.titel.toLowerCase().includes(suchbegriff.toLowerCase()) ||
        b.beschreibung.toLowerCase().includes(suchbegriff.toLowerCase());
      return typOk && suchOk;
    });
  }, [berichte, filterTyp, suchbegriff]);

  const handleInputChange = (e) => {
    setNeuerBericht({ ...neuerBericht, [e.target.name]: e.target.value });
  };

  const handleTypChange = (typ) => {
    setNeuerBericht({ ...neuerBericht, typ, auftragId: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const berichtData = {
      id: Date.now(),
      ...neuerBericht,
      anzahl: parseInt(neuerBericht.anzahl) || 0
    };
    setBerichte([berichtData, ...berichte]);
    setNeuerBericht({ typ: '', titel: '', beschreibung: '', zeitraum: '', anzahl: '', auftragId: '' });
    setShowNeuerBericht(false);
  };

  const handleDelete = (id) => {
    setBerichte(berichte.filter((b) => b.id !== id));
    if (selectedBericht?.id === id) {
      setSelectedBericht(null);
    }
  };

  const handleBerichtAnzeigen = (bericht) => {
    setSelectedBericht(bericht);
  };

  const handleExport = () => {
    const exportData = {
      titel: selectedBericht.titel,
      typ: selectedBericht.typ,
      zeitraum: selectedBericht.zeitraum,
      anzahl: selectedBericht.anzahl,
      beschreibung: selectedBericht.beschreibung,
      datum: new Date().toLocaleDateString('de-DE')
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `bericht-${selectedBericht.titel.replace(/[^a-z0-9]/gi, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

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
            <span className="label">Berichte</span>
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
            <select value={filterTyp} onChange={(e) => setFilterTyp(e.target.value)}>
              <option value="alle">Alle Kategorien</option>
              <option value="Aufträge">Aufträge</option>
              <option value="Disposition">Disposition</option>
              <option value="Finanzen">Finanzen</option>
            </select>
          </div>
          <button 
            className="neuer-bericht-btn"
            onClick={() => setShowNeuerBericht(!showNeuerBericht)}
          >
            {showNeuerBericht ? 'Abbrechen' : '+ Neuer Bericht'}
          </button>
          {selectedBericht && (
            <button className="export-btn" onClick={handleExport}>
              Export
            </button>
          )}
        </div>
      </div>

      {/* NEUER BERICHT FORM - MIT AUFTRAGS-AUSWAHL */}
      {showNeuerBericht && (
        <div className="neuer-bericht-form-wrapper">
          <h3>Neuen Bericht erstellen</h3>
          <form className="neuer-bericht-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <select 
                name="typ" 
                value={neuerBericht.typ} 
                onChange={(e) => handleTypChange(e.target.value)} 
                required
              >
                <option value=""> Typ wählen</option>
                <option value="Aufträge"> Aufträge ({auftraege.length})</option>
                <option value="Disposition"> Mitarbeiter ({mitarbeiter.length})</option>
                <option value="Finanzen"> Verrechnungen ({verrechnungen.length})</option>
              </select>

              {/* AUFTRAG AUSWAHL */}
              {neuerBericht.typ === 'Aufträge' && (
                <select 
                  name="auftragId" 
                  value={neuerBericht.auftragId} 
                  onChange={handleInputChange}
                  className="auftrag-auswahl"
                >
                  <option value=""> Alle Aufträge</option>
                  {auftraege.map(auftrag => (
                    <option key={auftrag.id} value={auftrag.id}>
                      {auftrag.kunde} - {auftrag.aufgabe}
                    </option>
                  ))}
                </select>
              )}

              {neuerBericht.typ === 'Disposition' && (
                <select 
                  name="auftragId" 
                  value={neuerBericht.auftragId} 
                  onChange={handleInputChange}
                  className="mitarbeiter-auswahl"
                >
                  <option value=""> Alle Mitarbeiter</option>
                  {mitarbeiter.map(mitarbeiter => (
                    <option key={mitarbeiter.id} value={mitarbeiter.id}>
                      {mitarbeiter.name}
                    </option>
                  ))}
                </select>
              )}

              <input 
                name="titel" 
                placeholder="Titel" 
                value={neuerBericht.titel} 
                onChange={handleInputChange} 
                required 
              />
              <input 
                name="zeitraum" 
                placeholder="Zeitraum"
                type='date' 
                value={neuerBericht.zeitraum}
                onChange={handleInputChange}    
                required 
              />
              <input 
                name="anzahl" 
                type="number" 
                placeholder="Anzahl Einträge" 
                value={neuerBericht.anzahl} 
                onChange={handleInputChange} 
              />
              <textarea
                name="beschreibung"
                placeholder="Beschreibung"
                value={neuerBericht.beschreibung}
                onChange={handleInputChange}
                rows="3"
                required
              />
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowNeuerBericht(false)}>
                Abbrechen
              </button>
              <button type="submit" className="speichern-btn">
                Bericht speichern
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="berichte-layout">
        <div className="berichte-liste">
          {gefilterteBerichte.length === 0 ? (
            <div className="empty-state">
              <h3>Keine Berichte gefunden</h3>
              <p>Filter oder Suchbegriff anpassen, um mehr Berichte zu sehen.</p>
            </div>
          ) : (
            gefilterteBerichte.map((bericht) => (
              <div 
                key={bericht.id} 
                className={`bericht-karte ${selectedBericht?.id === bericht.id ? 'selected' : ''}`}
                onClick={() => handleBerichtAnzeigen(bericht)}
              >
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
                  <div className="karte-actions">
                    <button className="anzeigen-btn">Bericht anzeigen</button>
                    <button 
                      className="delete-btn-klein" 
                      onClick={(e) => {e.stopPropagation(); handleDelete(bericht.id);}}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <aside className="berichte-detail">
          {selectedBericht ? (
            <div>
              <div className="selected-bericht-header">
                <h2>{selectedBericht.titel}</h2>
                <span className={`typ-badge typ-${selectedBericht.typ.toLowerCase()} large`}>
                  {selectedBericht.typ}
                </span>
              </div>
              
              <div className="bericht-detail-content">
                <div className="detail-row">
                  <span className="detail-label">Zeitraum:</span>
                  <span className="detail-value">{selectedBericht.zeitraum}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Einträge:</span>
                  <span className="detail-value">{selectedBericht.anzahl}</span>
                </div>
                {selectedBericht.auftragId && (
                  <div className="detail-row">
                    <span className="detail-label">Basis:</span>
                    <span className="detail-value">
                      {auftraege.find(a => a.id == selectedBericht.auftragId)?.kunde || 'Alle'}
                    </span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Beschreibung:</span>
                  <span className="detail-value full">{selectedBericht.beschreibung}</span>
                </div>
              </div>

            </div>
          ) : (
            <div>
              <h2>Berichtsübersicht</h2>
              <p>Wähle links einen Bericht aus, um ihn zu öffnen oder zu exportieren.</p>
              
              <div className="berichte-summary-cards">
                <div className="summary-card">
                  <span className="summary-label">Auftragsberichte</span>
                  <span className="summary-value">{berichte.filter(b => b.typ === 'Aufträge').length}</span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Disposition</span>
                  <span className="summary-value">{berichte.filter(b => b.typ === 'Disposition').length}</span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Finanzen</span>
                  <span className="summary-value">{berichte.filter(b => b.typ === 'Finanzen').length}</span>
                </div>
              </div>

              <div className="hinweis-box">
                <h4>Backend Integration</h4>
                <p>Ersetze die Mock-Daten durch deine PHP APIs (aufgraege.php, mitarbeiter.php, verrechnungen.php)</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default Berichte;
