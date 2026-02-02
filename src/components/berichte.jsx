import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { apiCall, API_ENDPOINTS } from '../services/api.jsx';
import './berichte.css';




function Berichte() {
  // ========== STATES ==========
  const [berichte, setBerichte] = useState([]);
  const [auftraege, setAuftraege] = useState([]);
  const [mitarbeiter, setMitarbeiter] = useState([]);
  const [kunden, setKunden] = useState([]);
 
  // Filter & Search
  const [filterTyp, setFilterTyp] = useState('alle');
  const [suchbegriff, setSuchbegriff] = useState('');
  const [filterFreigegeben, setFilterFreigegeben] = useState('alle');
  const [filterMitarbeiter, setFilterMitarbeiter] = useState('');
  const [filterDatumVon, setFilterDatumVon] = useState('');
  const [filterDatumBis, setFilterDatumBis] = useState('');
 
  // UI States
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
 
  // Neue/Edit Bericht Form
  const [showNeuerBericht, setShowNeuerBericht] = useState(false);
  const [editingBerichtId, setEditingBerichtId] = useState(null);
  const [neuerBericht, setNeuerBericht] = useState({
    kundeId: '',
    auftragId: '',
    mitarbeiterId: '',
    arbeitsdatum: '',
    arbeitszeit: '',
    bemerkung: ''
  });
 
  // Detail View
  const [selectedBericht, setSelectedBericht] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);





  // ========== INITIAL LOAD ==========
  useEffect(() => {
    loadAllData();
  }, [filterDatumVon, filterDatumBis, filterMitarbeiter, suchbegriff]);

  // ========== LOAD DATA WITH FILTERS ==========
 const loadAllData = async () => {
  setLoading(true);
  try {
    setError(null);

    const params = new URLSearchParams();
    if (filterDatumVon) params.append('zeitraum_von', filterDatumVon);
    if (filterDatumBis) params.append('zeitraum_bis', filterDatumBis);
    if (filterMitarbeiter) params.append('mitarbeiter_id', filterMitarbeiter);
    if (suchbegriff) params.append('search', suchbegriff);

    const berichteUrl = `${API_ENDPOINTS.rapportieren}${params.toString() ? '?' + params.toString() : ''}`;

    // ⭐ TEST: Log API_ENDPOINTS
    console.log('🔍 API_ENDPOINTS:', API_ENDPOINTS);
    console.log('📍 verrechnungen endpoint:', API_ENDPOINTS.verrechnungen);

    const [berichteRes, auftraegeRes, mitarbeiterRes, kundenRes, verrechnungenRes] = await Promise.all([
      apiCall(berichteUrl, 'GET'),
      apiCall(API_ENDPOINTS.auftraege, 'GET'),
      apiCall(API_ENDPOINTS.mitarbeiter, 'GET'),
      apiCall(API_ENDPOINTS.kunden, 'GET'),
      apiCall(API_ENDPOINTS.verrechnungen, 'GET')
    ]);

    // ⭐ RAW RESPONSE LOGGING
    console.log('📦 verrechnungenRes (raw):', verrechnungenRes);
    console.log('   Type:', typeof verrechnungenRes);
    console.log('   Is Array:', Array.isArray(verrechnungenRes));
    console.log('   Keys:', Object.keys(verrechnungenRes || {}));

    const berichteData = Array.isArray(berichteRes) ? berichteRes : berichteRes.data || [];
    setBerichte(berichteData);
    setAuftraege(Array.isArray(auftraegeRes) ? auftraegeRes : auftraegeRes.data || []);
    setMitarbeiter(Array.isArray(mitarbeiterRes) ? mitarbeiterRes : mitarbeiterRes.data || []);
    setKunden(Array.isArray(kundenRes) ? kundenRes : kundenRes.data || []);

    if (selectedBericht) {
      const updatedBericht = berichteData.find(b => b.id === selectedBericht.id);
      if (updatedBericht) {
        setSelectedBericht(updatedBericht);
      }
    }
     
  } catch (err) {
    setError(err.message || 'Fehler beim Laden der Daten');
    console.error('Fehler:', err);
  } finally {
    setLoading(false);
  }
};

  // ========== HELPER FUNCTIONS ==========
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





  // ========== FILTER LOGIC ==========
  const gefilterteBerichte = useMemo(() => {
    return berichte.filter((b) => {
      // Filter by Freigegeben status
      const freigegeben_ok = filterFreigegeben === 'alle' ||
        (filterFreigegeben === 'freigegeben' && b.freigegeben) ||
        (filterFreigegeben === 'entwurf' && !b.freigegeben);



      // Filter by Typ
      const typOk = filterTyp === 'alle' || b.typ === filterTyp;



      return freigegeben_ok && typOk;
    });
  }, [berichte, filterTyp, filterFreigegeben]);





  // ========== FORM HANDLERS ==========
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



  const resetForm = () => {
    setNeuerBericht({
      kundeId: '',
      auftragId: '',
      mitarbeiterId: '',
      arbeitsdatum: '',
      arbeitszeit: '',
      bemerkung: ''
    });
    setEditingBerichtId(null);
  };



  const startEdit = (bericht) => {
    if (bericht.freigegeben) {
      setError('Freigegebene Berichte können nicht bearbeitet werden');
      return;
    }
    setEditingBerichtId(bericht.id);
    // ⭐ WICHTIG: Verwende die Raw-Felder aus dem Backend
    setNeuerBericht({
      kundeId: bericht.kunde?.kunden_id || bericht.kunde?.id || '',
      auftragId: bericht.auftrag_id || bericht.auftragId || '',
      mitarbeiterId: bericht.mitarbeiter_id || bericht.mitarbeiterId || '',
      arbeitsdatum: bericht.arbeitsdatum || '',
      arbeitszeit: String(bericht.arbeitszeit ?? ''),
      bemerkung: bericht.bemerkung ?? bericht.beschreibung ?? ''
    });
    setShowNeuerBericht(true);
    setSelectedBericht(null);
  };





  // ========== SUBMIT HANDLER (CREATE + UPDATE) ==========
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



      console.log('📤 Sending to API:', berichtData);



      let response;
     
      if (editingBerichtId) {
        // UPDATE
        console.log('🔄 UPDATE Bericht ID:', editingBerichtId);
        response = await apiCall(
          `${API_ENDPOINTS.rapportieren}?report_id=${editingBerichtId}`,
          'PUT',
          berichtData
        );
        console.log('✅ Update Response:', response);
       
        // ⭐ KRITISCH: Direkt den State mit dem Response aktualisieren
        if (response.success && response.data) {
          setBerichte(prevBerichte =>
            prevBerichte.map(b => b.id === editingBerichtId ? response.data : b)
          );
          setSelectedBericht(response.data);
          console.log('✅ State aktualisiert mit Response data:', response.data);
        }
       
        setSuccess('Bericht erfolgreich aktualisiert!');
      } else {
        // CREATE
        console.log('✨ CREATE neuer Bericht');
        response = await apiCall(API_ENDPOINTS.rapportieren, 'POST', berichtData);
        console.log('✅ Create Response:', response);
       
        // ⭐ Neuen Bericht zur Liste hinzufügen
        if (response.success && response.data) {
          setBerichte(prevBerichte => [response.data, ...prevBerichte]);
          console.log('✅ Neuer Bericht zur Liste hinzugefügt');
        }
       
        setSuccess('Bericht erfolgreich erstellt!');
      }



      resetForm();
      setShowNeuerBericht(false);
     
      setTimeout(() => setSuccess(null), 3000);



    } catch (err) {
      setError(err.message || 'Fehler beim Speichern des Berichts');
      console.error('❌ Submit-Fehler:', err);
    } finally {
      setIsSubmitting(false);
    }
  };





  // ========== DELETE HANDLER ==========
  const handleDelete = async (id) => {
    if (!window.confirm('Möchtest du diesen Bericht wirklich löschen?')) {
      return;
    }



    try {
      console.log('🗑️ Lösche Bericht ID:', id);
      await apiCall(`${API_ENDPOINTS.rapportieren}?report_id=${id}`, 'DELETE');
      setBerichte(berichte.filter(b => b.id !== id));
      if (selectedBericht?.id === id) {
        setSelectedBericht(null);
      }
      setSuccess('Bericht gelöscht');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message || 'Fehler beim Löschen');
      console.error('❌ Delete-Fehler:', err);
    }
  };





  // ========== FREIGABE HANDLER ==========
  const handleFreigeben = async (berichtId) => {
    if (!window.confirm('Diesen Bericht freigeben? Dies kann nicht rückgängig gemacht werden.')) {
      return;
    }



    try {
      console.log('✓ Freigeben Bericht ID:', berichtId);
      const response = await apiCall(
        `${API_ENDPOINTS.rapportieren}?report_id=${berichtId}`,
        'PUT',
        { freigegeben: true }
      );
     
      console.log('✅ Freigeben Response:', response);
     
      // ⭐ Direkt den State aktualisieren
      if (response.success && response.data) {
        setBerichte(prevBerichte =>
          prevBerichte.map(b => b.id === berichtId ? response.data : b)
        );
        setSelectedBericht(null);
      }
     
      setSuccess('Bericht freigegeben');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message || 'Fehler beim Freigeben');
      console.error('❌ Freigeben-Fehler:', err);
    }
  };





  const handleBerichtAnzeigen = (bericht) => {
    setShowNeuerBericht(false);
    setEditingBerichtId(null);
    setSelectedBericht(bericht);
  };

// ========== PDF EXPORT ==========
const handlePdfExport = async () => {
  if (!selectedBericht) return;

  setIsPdfExporting(true);
  try {
    console.log('✅ Backend-Daten:', selectedBericht);
    console.log('✅ Verrechnungen:', selectedBericht.verrechnungen);

    const selectedAuftrag = auftraege.find(a => a.auftrag_id === selectedBericht.auftrag_id);

    // ⭐ DIREKT AUS selectedBericht.verrechnungen!
    const pdfVerrechnungen = selectedBericht.verrechnungen && selectedBericht.verrechnungen.length > 0
      ? selectedBericht.verrechnungen
          .map(v => `
            <div style="background: #f9f9f9; padding: 12px; margin: 10px 0; border-left: 4px solid #007cba; border-radius: 6px; font-size: 11px;">
              <div style="font-weight: bold; font-size: 12px; margin-bottom: 6px;">Verrechnung #${v.verrechnung_id}</div>
              <div style="margin: 2px 0;"><strong>Betrag:</strong> CHF ${parseFloat(v.betrag || 0).toFixed(2)}</div>
              <div style="margin: 2px 0;"><strong>Status:</strong> ${v.status || 'Offen'}</div>
              <div style="margin: 2px 0;"><strong>Datum:</strong> ${v.rechnungsdatum || '-'}</div>
              ${v.bemerkung ? `<div style="margin: 2px 0;"><strong>Bemerkung:</strong> ${v.bemerkung}</div>` : ''}
            </div>
          `)
          .join('')
      : '<div style="font-style: italic; color: #888; font-size: 11px;">Keine Verrechnungen für diesen Auftrag</div>';

   const htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Serviceauftrag</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #333; line-height: 1.3; }
    .container { padding: 20px 15px; max-width: 190mm; max-height: 270mm; overflow: hidden; }
    .header { text-align: center; margin-bottom: 15px; }
    .header h1 { font-size: 20px; margin-bottom: 5px; font-weight: bold; }
    .divider { border-top: 1px solid #000; margin: 8px 0; }
    .section { margin-bottom: 8px; }
    .label { font-weight: bold; font-size: 9px; text-transform: uppercase; margin-bottom: 2px; }
    .value { font-size: 10px; margin-bottom: 1px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 8px; }
    .verrechnungen-section { background: #f8f9ff; border: 1px solid #ddd; padding: 8px; margin: 8px 0; font-size: 9px; }
    .auftragsdetails { background: #f5f5f5; padding: 6px; border-left: 2px solid #333; margin: 5px 0; font-size: 9px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SERVICEAUFTRAG</h1>
    </div>
    <div class="divider"></div>

    <div class="row">
      <div><div class="label">Datum:</div><div class="value">${new Date().toLocaleDateString('de-CH')}</div></div>
      <div><div class="label">Zeit:</div><div class="value">${new Date().toLocaleTimeString('de-CH', {hour: '2-digit', minute: '2-digit'})}</div></div>
    </div>

    <div class="divider"></div>

    <div class="section">
      <div class="label">Kunde:</div>
      <div class="value"><strong>${selectedBericht.kunde?.firma || '-'}</strong></div>
      <div class="value">${selectedBericht.kunde?.vorname || ''} ${selectedBericht.kunde?.name || ''}</div>
      <div class="value">${selectedBericht.kunde?.addresse || ''} ${selectedBericht.kunde?.plz || ''} ${selectedBericht.kunde?.ort || ''}</div>
      <div class="value">Tel: ${selectedBericht.kunde?.telefonnummer || '-'}</div>
    </div>

    <div class="divider"></div>

    <div class="section">
      <div class="label">Verrechnungen:</div>
      <div class="verrechnungen-section">${pdfVerrechnungen}</div>
    </div>

    <div class="section">
  <div class="label">Verrechnungsadresse:</div>
  <div class="value">${selectedBericht.kunde?.vorname || ''} ${selectedBericht.kunde?.name || ''}</div>
  <div class="value">${selectedBericht.kunde?.addresse || ''}</div>
  <div class="value">${selectedBericht.kunde?.plz || ''} ${selectedBericht.kunde?.ort || ''}</div>
</div>

    <div class="divider"></div>

    <div class="section">
      <div class="label">Arbeiten:</div>
      ${selectedAuftrag ? `<div class="auftragsdetails"><strong>${selectedAuftrag.auftragsname}</strong> | ${selectedAuftrag.status}</div>` : ''}
      <div style="font-size: 9px;">${selectedBericht.bemerkung || ''}</div>
    </div>

    <div class="row">
      <div><div class="label">Arbeitsdatum:</div><div class="value">${selectedBericht.zeitraum || '-'}</div></div>
      <div><div class="label">Arbeitszeit:</div><div class="value">${selectedBericht.arbeitszeit || 0}h</div></div>
    </div>

    <div class="row">
      <div><div class="label">Mitarbeiter:</div><div class="value">${selectedBericht.mitarbeiter || '-'}</div></div>
      <div></div>
    </div>
  </div>
</body>
</html>`;

    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    element.style.position = 'fixed';
    element.style.top = '-9999px';
    element.style.left = '-9999px';
    element.style.width = '210mm';
    element.style.backgroundColor = '#fff';
    document.body.appendChild(element);

    await new Promise(resolve => setTimeout(resolve, 100));

    // ⭐ WICHTIG: Sidebar verstecken während PDF-Erstellung
    const sidebar = document.querySelector('.berichte-detail');
    const originalDisplay = sidebar?.style.display;
    if (sidebar) sidebar.style.display = 'none';

    const canvas = await html2canvas(element, {
  scale: 1.5,  // Reduziert von 2
  useCORS: true,
  logging: false,
  backgroundColor: '#ffffff',
  allowTaint: true,
  imageTimeout: 0,
  windowWidth: 794,
  height: 1120  // A4 Höhe in Pixel (fest)
});

    // ⭐ Sidebar wiederherstellen
    if (sidebar) sidebar.style.display = originalDisplay || '';

    document.body.removeChild(element);

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pageHeight = 297;
    const pageWidth = 210;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, Math.min(imgHeight, pageHeight));
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const fileName = `serviceauftrag-${selectedBericht.id}-${new Date().getTime()}.pdf`;
    pdf.save(fileName);
    
    setSuccess('PDF mit Verrechnungen erfolgreich heruntergeladen!');
    setTimeout(() => setSuccess(null), 3000);

  } catch (err) {
    setError('Fehler beim PDF-Export: ' + err.message);
    console.error('❌ PDF Export Error:', err);
  } finally {
    setIsPdfExporting(false);
  }
};


  // ========== JSON EXPORT =====
  const handleExport = () => {
    if (!selectedBericht) return;



    const exportData = {
      id: selectedBericht.id,
      titel: selectedBericht.titel,
      typ: selectedBericht.typ,
      zeitraum: selectedBericht.zeitraum,
      arbeitsdatum: selectedBericht.arbeitsdatum,
      beschreibung: selectedBericht.bemerkung,
      mitarbeiter: selectedBericht.mitarbeiter,
      kunde: selectedBericht.kunde,
      arbeitszeit: selectedBericht.arbeitszeit,
      freigegeben: selectedBericht.freigegeben,
      exportDatum: new Date().toLocaleDateString('de-DE')
    };
   
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `bericht-${selectedBericht.id}-${new Date().getTime()}.json`;
   
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };





  // ========== RENDER ==========
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
              <option value="Auftraege">Auftraege</option>
              <option value="Disposition">Disposition</option>
              <option value="Finanzen">Finanzen</option>
            </select>
          </div>



          <div className="berichte-filter">
            <select value={filterFreigegeben} onChange={(e) => setFilterFreigegeben(e.target.value)}>
              <option value="alle">Alle Status</option>
              <option value="entwurf">Entwurf</option>
              <option value="freigegeben">Freigegeben</option>
            </select>
          </div>



          <button
            className="neuer-bericht-btn"
            onClick={() => {
              resetForm();
              setShowNeuerBericht(!showNeuerBericht);
            }}
            disabled={isSubmitting}
          >
            {showNeuerBericht ? 'Abbrechen' : '+ Neuer Bericht'}
          </button>



          {selectedBericht && (
            <>
              {!selectedBericht.freigegeben && (
                <button
                  className="anzeigen-btn"
                  onClick={() => startEdit(selectedBericht)}
                  title="Bearbeiten"
                >
                  ✏️ Bearbeiten
                </button>
              )}
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
              {!selectedBericht.freigegeben && (
                <button
                  className="neuer-bericht-btn"
                  onClick={() => handleFreigeben(selectedBericht.id)}
                  title="Freigeben"
                >
                  ✓ Freigeben
                </button>
              )}
            </>
          )}
        </div>
      </div>



      {error && (
        <div style={{ padding: 'var(--space-16) var(--space-32)', backgroundColor: 'rgba(192, 21, 47, 0.1)', color: 'var(--color-error)', borderLeft: '4px solid var(--color-error)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>
      )}
      {success && (
        <div style={{ padding: 'var(--space-16) var(--space-32)', backgroundColor: 'rgba(33, 128, 141, 0.1)', color: 'var(--color-success)', borderLeft: '4px solid var(--color-success)' }}>
          {success}
        </div>
      )}
      {loading && (
        <div style={{ padding: 'var(--space-16) var(--space-32)', backgroundColor: 'rgba(98, 108, 113, 0.1)', color: 'var(--color-info)', borderLeft: '4px solid var(--color-info)' }}>
          Lädt...
        </div>
      )}



      {showNeuerBericht && (
        <div className="neuer-bericht-form-wrapper">
          <h3>{editingBerichtId ? 'Bericht bearbeiten' : 'Neuen Bericht erstellen'}</h3>
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
                <div style={{ gridColumn: '1 / -1', background: 'var(--color-secondary)', padding: 'var(--space-16)', borderRadius: 'var(--radius-base)', fontSize: 'var(--font-size-sm)' }}>
                  <strong>Kontakt:</strong>
                  <p style={{ margin: 'var(--space-8) 0 0 0' }}><strong>{selectedKunde.firma}</strong></p>
                  <p style={{ margin: 'var(--space-4) 0' }}>{selectedKunde.vorname} {selectedKunde.name}</p>
                  <p style={{ margin: 'var(--space-4) 0' }}>{selectedKunde.addresse}</p>
                  <p style={{ margin: 'var(--space-4) 0' }}>{selectedKunde.plz} {selectedKunde.ort}</p>
                  {selectedKunde.telefonnummer && <p style={{ margin: 'var(--space-4) 0' }}>Tel: {selectedKunde.telefonnummer}</p>}
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
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowNeuerBericht(false);
                  resetForm();
                }}
              >
                Abbrechen
              </button>
              <button type="submit" className="speichern-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Speichert...' : editingBerichtId ? 'Änderungen speichern' : 'Bericht speichern'}
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
                    {bericht.typ || 'Auftraege'}
                  </span>
                  {bericht.freigegeben && <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✓ Freigegeben</span>}
                  <span className="bericht-anzahl">{bericht.arbeitszeit}h</span>
                </div>
                <h3>{bericht.titel}</h3>
                <p className="bericht-beschreibung">{bericht.bemerkung || 'Keine Beschreibung'}</p>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', margin: 'var(--space-16) 0 0 0' }}>
                  <strong>Kunde:</strong> {bericht.kunde?.vorname} {bericht.kunde?.name}
                </p>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', margin: 'var(--space-8) 0 0 0' }}>
                  <strong>Mitarbeiter:</strong> {bericht.mitarbeiter || '-'}
                </p>
                <div className="bericht-footer-row">
                  <span className="zeitraum">{bericht.zeitraum}</span>
                  <div className="karte-actions">
                    <button
                      className="delete-btn-klein"
                      onClick={(e) => {e.stopPropagation(); handleDelete(bericht.id);}}
                      title="Löschen"
                      disabled={bericht.freigegeben}
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
              <div>
                <div className="selected-bericht-header">
                  <h2>{selectedBericht.titel}</h2>
                  <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
                    <span className={`typ-badge typ-${selectedBericht.typ?.toLowerCase()} large`}>
                      {selectedBericht.typ || 'Auftraege'}
                    </span>
                  </div>
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



                  <div style={{ marginTop: 'var(--space-24)', paddingTop: 'var(--space-24)', borderTop: '1px solid var(--color-card-border)' }}>
                    <h4 style={{ fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-16) 0', fontWeight: 'var(--font-weight-semibold)' }}>Kundendetails</h4>
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



                  {selectedBericht.bemerkung && selectedBericht.bemerkung !== 'Keine Beschreibung' && (
                    <div className="detail-row">
                      <span className="detail-label">Bemerkung:</span>
                      <span className="detail-value" style={{ justifyContent: 'flex-start', whiteSpace: 'pre-wrap' }}>{selectedBericht.bemerkung}</span>
                    </div>
                  )}



                                    {/* Verrechnungen für diesen Bericht anzeigen */}
                  {selectedBericht.verrechnungen && selectedBericht.verrechnungen.length > 0 && (
                    <div style={{ marginTop: 'var(--space-24)', paddingTop: 'var(--space-24)', borderTop: '1px solid var(--color-card-border)' }}>
                      <h4 style={{ fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-16) 0', fontWeight: 'var(--font-weight-semibold)' }}>Verrechnung</h4>
                      {selectedBericht.verrechnungen.map(v => (
                        <div key={v.verrechnung_id} style={{ background: 'var(--color-secondary)', padding: 'var(--space-12)', borderRadius: 'var(--radius-base)', marginBottom: 'var(--space-12)', borderLeft: '3px solid var(--color-warning)' }}>
                          <p style={{ margin: 'var(--space-6) 0', fontSize: 'var(--font-size-sm)' }}><strong>Betrag:</strong> CHF {parseFloat(v.betrag || 0).toFixed(2)}</p>
                          <p style={{ margin: 'var(--space-6) 0', fontSize: 'var(--font-size-sm)' }}><strong>Status:</strong> {v.status}</p>
                          <p style={{ margin: 'var(--space-6) 0', fontSize: 'var(--font-size-sm)' }}><strong>Datum:</strong> {v.rechnungsdatum}</p>
                          {v.bemerkung && <p style={{ margin: 'var(--space-6) 0', fontSize: 'var(--font-size-sm)' }}><strong>Bemerkung:</strong> {v.bemerkung}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div>
              <h2>Berichtsübersicht</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>Wähle links einen Bericht aus, um Details zu sehen oder zu exportieren.</p>
             
              <div className="berichte-summary-cards">
                <div className="summary-card">
                  <span className="summary-label">Auftragsberichte</span>
                  <span className="summary-value">{berichte.length} {/* Alle Berichte als Auftragsberichte */}</span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Freigegeben</span>
                  <span className="summary-value">{berichte.filter(b => b.freigegeben).length}</span>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}



export default Berichte;

