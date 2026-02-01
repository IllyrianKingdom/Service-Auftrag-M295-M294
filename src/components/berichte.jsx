import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { apiCall, API_ENDPOINTS } from '../services/api.jsx';
import './berichte.css';

function Berichte() {
  const [berichte, setBerichte] = useState([]);
  const [auftraege, setAuftraege] = useState([]);
  const [mitarbeiter, setMitarbeiter] = useState([]);
  const [kunden, setKunden] = useState([]);
  
  const [filterTyp, setFilterTyp] = useState('alle');
  const [suchbegriff, setSuchbegriff] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [showNeuerBericht, setShowNeuerBericht] = useState(false);
  const [neuerBericht, setNeuerBericht] = useState({
    kundeId: '',
    auftragId: '',
    mitarbeiterId: '',
    arbeitsdatum: '',
    arbeitszeit: '',
    bemerkung: ''
  });
  const [selectedBericht, setSelectedBericht] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      setError(null);
      const [berichteRes, auftraegeRes, mitarbeiterRes, kundenRes] = await Promise.all([
        apiCall(API_ENDPOINTS.rapportieren, 'GET'),
        apiCall(API_ENDPOINTS.auftraege, 'GET'),
        apiCall(API_ENDPOINTS.mitarbeiter, 'GET'),
        apiCall(API_ENDPOINTS.kunden, 'GET')
      ]);

      setBerichte(Array.isArray(berichteRes) ? berichteRes : berichteRes.data || []);
      setAuftraege(Array.isArray(auftraegeRes) ? auftraegeRes : auftraegeRes.data || []);
      setMitarbeiter(Array.isArray(mitarbeiterRes) ? mitarbeiterRes : mitarbeiterRes.data || []);
      setKunden(Array.isArray(kundenRes) ? kundenRes : kundenRes.data || []);
      
    } catch (err) {
      setError(err.message || 'Fehler beim Laden der Daten');
      console.error('Fehler:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('de-DE');
    } catch {
      return dateStr;
    }
  };

  const selectedKunde = kunden.find(k => k.kunden_id === parseInt(neuerBericht.kundeId));

  const auftrageFuerKunde = auftraege.filter(a => 
    parseInt(a.kunden_id) === parseInt(neuerBericht.kundeId)
  );

  const gefilterteBerichte = useMemo(() => {
    return berichte.filter((b) => {
      const typOk = filterTyp === 'alle' || b.typ === filterTyp;
      const suchOk = !suchbegriff || 
        b.titel.toLowerCase().includes(suchbegriff.toLowerCase()) ||
        b.beschreibung.toLowerCase().includes(suchbegriff.toLowerCase()) ||
        (b.mitarbeiter && b.mitarbeiter.toLowerCase().includes(suchbegriff.toLowerCase())) ||
        (b.kunde?.firma && b.kunde.firma.toLowerCase().includes(suchbegriff.toLowerCase())) ||
        (b.kunde?.name && b.kunde.name.toLowerCase().includes(suchbegriff.toLowerCase()));
      return typOk && suchOk;
    });
  }, [berichte, filterTyp, suchbegriff]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNeuerBericht(prev => ({ ...prev, [name]: value }));
  };

  const handleKundeChange = (e) => {
    setNeuerBericht(prev => ({
      ...prev,
      kundeId: e.target.value,
      auftragId: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!neuerBericht.kundeId || !neuerBericht.auftragId || !neuerBericht.mitarbeiterId || 
          !neuerBericht.arbeitsdatum || !neuerBericht.arbeitszeit) {
        setError('Bitte fülle alle erforderlichen Felder aus');
        setIsSubmitting(false);
        return;
      }

      const arbeitszeit = parseFloat(neuerBericht.arbeitszeit);
      if (arbeitszeit <= 0) {
        setError('Arbeitszeit muss größer als 0 sein');
        setIsSubmitting(false);
        return;
      }

      const berichtData = {
        arbeitsdatum: neuerBericht.arbeitsdatum,
        arbeitszeit: arbeitszeit,
        bemerkung: neuerBericht.bemerkung,
        mitarbeiter_id: parseInt(neuerBericht.mitarbeiterId),
        auftrag_id: parseInt(neuerBericht.auftragId)
      };

      console.log('Sending to API:', berichtData);
      const response = await apiCall(API_ENDPOINTS.rapportieren, 'POST', berichtData);
      
      console.log('Response von API:', response);
      
      await loadAllData();

      setNeuerBericht({
        kundeId: '',
        auftragId: '',
        mitarbeiterId: '',
        arbeitsdatum: '',
        arbeitszeit: '',
        bemerkung: ''
      });
      setShowNeuerBericht(false);
      setSuccess('Bericht erfolgreich erstellt!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError(err.message || 'Fehler beim Erstellen des Berichts');
      console.error('Submit-Fehler:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Möchtest du diesen Bericht wirklich löschen?')) {
      return;
    }

    try {
      await apiCall(`${API_ENDPOINTS.rapportieren}?report_id=${id}`, 'DELETE');
      setBerichte(berichte.filter(b => b.id !== id));
      if (selectedBericht?.id === id) {
        setSelectedBericht(null);
      }
      setSuccess('Bericht gelöscht');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message || 'Fehler beim Löschen');
    }
  };

  const handleBerichtAnzeigen = (bericht) => {
    setSelectedBericht(bericht);
  };

  // ===== PDF EXPORT FUNKTION =====
  const handlePdfExport = async () => {
  if (!selectedBericht) return;

  setIsPdfExporting(true);
  try {
    const selectedAuftrag = auftraege.find(a => a.auftrag_id === selectedBericht.auftragId);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Serviceauftrag</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif;
            padding: 0;
            font-size: 12px;
            color: #333;
            line-height: 1.6;
          }
          .container {
            padding: 80px 60px 40px 60px;
          }
          .header { text-align: center; margin-bottom: 50px; }
          .header h1 { font-size: 28px; letter-spacing: 3px; margin-bottom: 20px; font-weight: bold; }
          .divider { border-top: 2px solid #000; margin: 20px 0; }
          .section { margin-bottom: 20px; }
          .label { font-weight: bold; font-size: 11px; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
          .value { font-size: 12px; margin-bottom: 3px; line-height: 1.5; }
          .row { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 15px; }
          .row-single { margin-bottom: 15px; }
          .auftragsdetails { background-color: #f5f5f5; padding: 12px; border-left: 3px solid #333; margin: 10px 0; font-size: 12px; }
          .description { margin-top: 12px; font-size: 12px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SERVICEAUFTRAG</h1>
          </div>

          <div class="divider"></div>

          <div class="row">
            <div class="row-single">
              <div class="label">Datum:</div>
              <div class="value">${new Date().toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
            </div>
            <div class="row-single">
              <div class="label">Zeit:</div>
              <div class="value">${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="section">
            <div class="label">Kunde/Kontaktperson:</div>
            <div class="value"><strong>${selectedBericht.kunde?.firma}</strong></div>
            <div class="value">${selectedBericht.kunde?.vorname} ${selectedBericht.kunde?.name}</div>
            <div class="value">${selectedBericht.kunde?.addresse}</div>
            <div class="value">${selectedBericht.kunde?.plz} ${selectedBericht.kunde?.ort}</div>
          </div>

          <div class="section">
            <div class="label">Telefon:</div>
            <div class="value">${selectedBericht.kunde?.telefonnummer || '-'}</div>
          </div>

          <div class="divider"></div>

          <div class="section">
            <div class="label">Adresse Verrechnung:</div>
            <div class="value"><strong>${selectedBericht.kunde?.firma}</strong></div>
            <div class="value">${selectedBericht.kunde?.addresse}</div>
            <div class="value">${selectedBericht.kunde?.plz} ${selectedBericht.kunde?.ort}</div>
          </div>

          <div class="divider"></div>

          <div class="section">
            <div class="label">Auszuführende Arbeiten:</div>
            
            ${selectedAuftrag ? `
              <div class="auftragsdetails">
                <strong>Auftrag:</strong> ${selectedAuftrag.auftragsname}<br>
                <strong>Status:</strong> ${selectedAuftrag.status || 'Offen'}<br>
                ${selectedAuftrag.beschreibung ? `<strong>Details:</strong> ${selectedAuftrag.beschreibung}` : ''}
              </div>
            ` : ''}

            ${selectedBericht.beschreibung && selectedBericht.beschreibung !== 'Keine Beschreibung' ? `
              <div class="description">${selectedBericht.beschreibung}</div>
            ` : ''}
          </div>

          <div class="divider"></div>

          <div class="section">
            <div class="label">Terminwunsch:</div>
            <div class="value">${selectedBericht.zeitraum}</div>
          </div>

          <div class="section">
            <div class="label">Arbeitszeit:</div>
            <div class="value">${selectedBericht.arbeitszeit} Stunden</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Erstelle ein unsichtbares div mit dem HTML
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    element.style.position = 'fixed';
    element.style.top = '-9999px';
    element.style.left = '-9999px';
    element.style.width = '210mm';
    element.style.backgroundColor = '#fff';
    document.body.appendChild(element);

    // Warte bis das Element gerendert ist
    await new Promise(resolve => setTimeout(resolve, 100));

    // Konvertiere zu Canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      imageTimeout: 0,
      windowWidth: 794
    });

    // Entferne das Element
    document.body.removeChild(element);

    // Erstelle PDF
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pageHeight = 297; // A4 Höhe in mm
    const pageWidth = 210;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Erste Seite
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, Math.min(imgHeight, pageHeight));
    heightLeft -= pageHeight;

    // Weitere Seiten
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download als PDF
    const fileName = `serviceauftrag-${selectedBericht.id}-${new Date().getTime()}.pdf`;
    pdf.save(fileName);
    
    setSuccess('PDF erfolgreich heruntergeladen!');
    setTimeout(() => setSuccess(null), 3000);

  } catch (err) {
    setError('Fehler beim PDF-Export: ' + err.message);
    console.error('PDF Export Error:', err);
  } finally {
    setIsPdfExporting(false);
  }
};

  // ===== JSON EXPORT (ORIGINAL) =====
  const handleExport = () => {
    if (!selectedBericht) return;

    const exportData = {
      titel: selectedBericht.titel,
      typ: selectedBericht.typ,
      zeitraum: selectedBericht.zeitraum,
      beschreibung: selectedBericht.beschreibung,
      mitarbeiter: selectedBericht.mitarbeiter,
      kunde: selectedBericht.kunde,
      arbeitszeit: selectedBericht.arbeitszeit,
      freigegeben: selectedBericht.freigegeben,
      exportDatum: new Date().toLocaleDateString('de-DE')
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
            disabled={isSubmitting}
          >
            {showNeuerBericht ? 'Abbrechen' : '+ Neuer Bericht'}
          </button>
          {selectedBericht && (
            <>
              <button 
                className="export-btn" 
                onClick={handlePdfExport}
                disabled={isPdfExporting}
              >
                {isPdfExporting ? '⏳ PDF wird erstellt...' : '📄 PDF Export'}
              </button>
              <button 
                className="export-btn" 
                onClick={handleExport}
              >
                📋 JSON Export
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}
      {loading && (
        <div className="alert alert-info">
          Lädt...
        </div>
      )}

      {showNeuerBericht && (
        <div className="neuer-bericht-form-wrapper">
          <h3>Neuen Bericht erstellen</h3>
          <form className="neuer-bericht-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <select 
                name="kundeId" 
                value={neuerBericht.kundeId} 
                onChange={handleKundeChange}
                required
              >
                <option value="">Kunde wählen</option>
                {kunden.map(k => (
                  <option key={k.kunden_id} value={k.kunden_id}>
                    {k.vorname} {k.name} - {k.firma}
                  </option>
                ))}
              </select>

              {selectedKunde && (
                <div className="kunde-info-box">
                  <strong>Kontakt:</strong>
                  <p><strong>{selectedKunde.firma}</strong></p>
                  <p>{selectedKunde.vorname} {selectedKunde.name}</p>
                  <p>{selectedKunde.addresse}</p>
                  <p>{selectedKunde.plz} {selectedKunde.ort}</p>
                  {selectedKunde.telefonnummer && <p>Tel: {selectedKunde.telefonnummer}</p>}
                </div>
              )}

              {neuerBericht.kundeId && (
                <select 
                  name="auftragId" 
                  value={neuerBericht.auftragId} 
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Auftrag wählen</option>
                  {auftrageFuerKunde.map(a => (
                    <option key={a.auftrag_id} value={a.auftrag_id}>
                      {a.auftragsname}
                    </option>
                  ))}
                </select>
              )}

              <select 
                name="mitarbeiterId" 
                value={neuerBericht.mitarbeiterId} 
                onChange={handleInputChange}
                required
              >
                <option value="">Mitarbeiter wählen</option>
                {mitarbeiter.map(m => (
                  <option key={m.mitarbeiter_id} value={m.mitarbeiter_id}>
                    {m.vorname} {m.name}
                  </option>
                ))}
              </select>

              <input 
                name="arbeitsdatum" 
                type="date" 
                value={neuerBericht.arbeitsdatum}
                onChange={handleInputChange}    
                required 
              />

              <input 
                name="arbeitszeit" 
                type="number" 
                step="0.5"
                min="0.5"
                placeholder="Arbeitszeit (Stunden)" 
                value={neuerBericht.arbeitszeit} 
                onChange={handleInputChange}
                required
              />

              <textarea
                name="bemerkung"
                placeholder="Bemerkung / Beschreibung (optional)"
                value={neuerBericht.bemerkung}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowNeuerBericht(false)}>
                Abbrechen
              </button>
              <button type="submit" className="speichern-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Speichert...' : 'Bericht speichern'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="berichte-layout">
        <div className="berichte-liste">
          {loading ? (
            <div className="empty-state">
              <h3>Lädt...</h3>
            </div>
          ) : gefilterteBerichte.length === 0 ? (
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
                  <span className={`typ-badge typ-${bericht.typ?.toLowerCase()}`}>
                    {bericht.typ || 'Aufträge'}
                  </span>
                  <span className="bericht-anzahl">{bericht.arbeitszeit}h</span>
                </div>
                <h3>{bericht.titel}</h3>
                <p className="bericht-beschreibung">{bericht.beschreibung || 'Keine Beschreibung'}</p>
                <p className="bericht-meta">
                  <strong>Kunde:</strong> {bericht.kunde?.vorname} {bericht.kunde?.name}
                </p>
                <p className="bericht-meta">
                  <strong>Mitarbeiter:</strong> {bericht.mitarbeiter || '-'}
                </p>
                <div className="bericht-footer-row">
                  <span className="zeitraum">{bericht.zeitraum}</span>
                  <div className="karte-actions">
                    <button 
                      className="delete-btn-klein" 
                      onClick={(e) => {e.stopPropagation(); handleDelete(bericht.id);}}
                      title="Löschen"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <aside className="berichte-detail">
          {selectedBericht ? (
            <>
              {/* UNSICHTBARER PDF-EXPORT CONTAINER */}
              <div id="pdf-export-content" style={{ display: 'none' }}>
                <PdfTemplate bericht={selectedBericht} />
              </div>

              {/* SICHTBARER DETAIL VIEW */}
              <div>
                <div className="selected-bericht-header">
                  <h2>{selectedBericht.titel}</h2>
                  <span className={`typ-badge typ-${selectedBericht.typ?.toLowerCase()} large`}>
                    {selectedBericht.typ || 'Aufträge'}
                  </span>
                </div>
                
                <div className="bericht-detail-content">
                  <div className="detail-row">
                    <span className="detail-label">Arbeitsdatum:</span>
                    <span className="detail-value">{selectedBericht.zeitraum}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Arbeitszeit:</span>
                    <span className="detail-value">{selectedBericht.arbeitszeit} h</span>
                  </div>

                  <div className="detail-section">
                    <h4>Kundendetails</h4>
                    <div className="detail-row">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">
                        {selectedBericht.kunde?.vorname} {selectedBericht.kunde?.name}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Firma:</span>
                      <span className="detail-value">{selectedBericht.kunde?.firma || '-'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Adresse:</span>
                      <span className="detail-value">{selectedBericht.kunde?.addresse || '-'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">PLZ/Ort:</span>
                      <span className="detail-value">
                        {selectedBericht.kunde?.plz} {selectedBericht.kunde?.ort}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Telefon:</span>
                      <span className="detail-value">{selectedBericht.kunde?.telefonnummer || '-'}</span>
                    </div>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Mitarbeiter:</span>
                    <span className="detail-value">{selectedBericht.mitarbeiter || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">
                      {selectedBericht.freigegeben ? '✓ Freigegeben' : '⏳ Entwurf'}
                    </span>
                  </div>
                  {selectedBericht.beschreibung && selectedBericht.beschreibung !== 'Keine Beschreibung' && (
                    <div className="detail-row">
                      <span className="detail-label">Bemerkung:</span>
                      <span className="detail-value full">{selectedBericht.beschreibung}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div>
              <h2>Berichtsübersicht</h2>
              <p>Wähle links einen Bericht aus, um Details zu sehen oder zu exportieren.</p>
              
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
                <h4>✓ Backend verbunden</h4>
                <p>Berichte werden live von der API geladen</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ===== PDF TEMPLATE KOMPONENTE =====
function PdfTemplate({ bericht }) {
  return (
    <div style={pdfStyles.container}>
      <div style={pdfStyles.header}>
        <h1 style={pdfStyles.title}>SERVICEAUFTRAG</h1>
      </div>

      <div style={pdfStyles.divider}></div>

      <div style={pdfStyles.section}>
        <div style={pdfStyles.row}>
          <div>
            <p style={pdfStyles.label}>Datum:</p>
            <p style={pdfStyles.value}>{new Date().toLocaleDateString('de-DE')}</p>
          </div>
          <div>
            <p style={pdfStyles.label}>Zeit:</p>
            <p style={pdfStyles.value}>{new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      <div style={pdfStyles.section}>
        <p style={pdfStyles.label}>Kunde/Kontaktperson:</p>
        <p style={pdfStyles.value}>
          {bericht.kunde?.vorname} {bericht.kunde?.name}
        </p>
        <p style={pdfStyles.value}>{bericht.kunde?.addresse}</p>
        <p style={pdfStyles.value}>
          {bericht.kunde?.plz} {bericht.kunde?.ort}
        </p>
      </div>

      <div style={pdfStyles.section}>
        <p style={pdfStyles.label}>Telefon:</p>
        <p style={pdfStyles.value}>{bericht.kunde?.telefonnummer || '-'}</p>
      </div>

      <div style={pdfStyles.divider}></div>

      <div style={pdfStyles.section}>
        <p style={pdfStyles.label}>Adresse Verrechnung:</p>
        <p style={pdfStyles.value}>
          {bericht.mitarbeiter}
        </p>
      </div>

      <div style={pdfStyles.divider}></div>

      <div style={pdfStyles.section}>
        <p style={pdfStyles.label}>Auszuführende Arbeiten:</p>
        <div style={pdfStyles.checkboxRow}>
          <div style={pdfStyles.checkbox}>
            <input type="checkbox" defaultChecked={bericht.typ === 'Aufträge'} />
            <span>Reparatur</span>
          </div>
          <div style={pdfStyles.checkbox}>
            <input type="checkbox" defaultChecked={bericht.typ === 'Disposition'} />
            <span>Sanitär</span>
          </div>
        </div>
        <div style={pdfStyles.checkboxRow}>
          <div style={pdfStyles.checkbox}>
            <input type="checkbox" />
            <span>Heizung</span>
          </div>
          <div style={pdfStyles.checkbox}>
            <input type="checkbox" />
            <span>Garantie</span>
          </div>
        </div>
        <p style={pdfStyles.description}>{bericht.beschreibung}</p>
      </div>

      <div style={pdfStyles.divider}></div>

      <div style={pdfStyles.section}>
        <p style={pdfStyles.label}>Terminwunsch:</p>
        <p style={pdfStyles.value}>{bericht.zeitraum}</p>
      </div>
    </div>
  );
}

// ===== PDF STYLES =====
const pdfStyles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    lineHeight: '1.6',
    fontSize: '12px',
    color: '#333',
    backgroundColor: '#fff'
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0',
    letterSpacing: '2px'
  },
  divider: {
    borderTop: '2px solid #000',
    margin: '15px 0'
  },
  section: {
    marginBottom: '15px'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px'
  },
  label: {
    fontWeight: 'bold',
    fontSize: '11px',
    margin: '5px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  value: {
    margin: '5px 0',
    fontSize: '12px'
  },
  checkboxRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    margin: '10px 0'
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  description: {
    marginTop: '10px',
    fontStyle: 'italic',
    fontSize: '11px'
  }
};

export default Berichte;
