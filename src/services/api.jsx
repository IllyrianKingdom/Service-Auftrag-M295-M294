// src/services/api.jsx

// ========== API CONFIG ==========
const API_BASE = 'http://localhost/TestReact';

export const API_ENDPOINTS = {
  mitarbeiter: `${API_BASE}/mitarbeiter.php`,
  kunden: `${API_BASE}/kunden.php`,
  auftraege: `${API_BASE}/auftraege.php`,
  disposition: `${API_BASE}/disposition.php`,
  rapportieren: `${API_BASE}/rapportieren.php`,
  verrechnung: `${API_BASE}/verrechnungen.php`,
  login: `${API_BASE}/login.php`
};

// ========== GENERIC FETCH WRAPPER ==========
export async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(endpoint, options);

    // ========== CHECK RESPONSE STATUS FIRST =========
    // WICHTIG: Status prüfen BEVOR wir .json() parsen
    if (!response.ok) {
      // Wenn HTTP-Fehler: Versuche HTML/Text zu lesen
      const errorText = await response.text();
      
      // Versuche JSON zu parsen, falls vorhanden
      let errorMessage = 'API request failed';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorText;
      } catch {
        // Falls nicht JSON, nutze Rohen Text
        errorMessage = errorText.substring(0, 200); // Erste 200 Zeichen
      }
      
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }

    // ========== PARSE JSON (Jetzt sicher!) =========
    const json = await response.json();

    // ========== RESPONSE HANDLING ==========
    // GET Requests: Returns array directly
    if (method === 'GET') {
      return Array.isArray(json) ? json : [];
    }

    // POST/PUT/DELETE Requests: Returns { success: true, data: ... }
    // Check für success flag
    if (!json.success) {
      throw new Error(json.error || json.message || 'API request failed');
    }

    return json;
  } catch (error) {
    console.error('API Error:', error);
    console.error('Error Stack:', error.stack);
    throw error;
  }
}