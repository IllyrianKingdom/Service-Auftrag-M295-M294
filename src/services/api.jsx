// src/services/api.jsx

// ========== API CONFIG ==========
const API_BASE = 'http://localhost/PHPBackend';

export const API_ENDPOINTS = {
  mitarbeiter: `${API_BASE}/mitarbeiter.php`,
  kunden: `${API_BASE}/kunden.php`,
  auftraege: `${API_BASE}/auftraege.php`,
  disposition: `${API_BASE}/disposition.php`,
  rapportieren: `${API_BASE}/rapportieren.php`,
  verrechnung: `${API_BASE}/verrechnungen.php`,
  login: `${API_BASE}/login.php`,
  logout: `${API_BASE}/logout.php`,
  
  // ⭐ NEU: Für Dashboard-Kompatibilität (Alias)
  berichte: `${API_BASE}/rapportieren.php`
};

// ========== ERROR MESSAGE MAPPING ==========
// Übersetzt HTTP-Status-Codes in benutzerfreundliche Meldungen
function getErrorMessage(status, serverError = null) {
  // Wenn der Server eine sprechende Fehlermeldung sendet, nutze diese
  if (serverError) {
    return serverError;
  }

  const errorMessages = {
    400: 'Die Anfrage war ungültig. Überprüfe deine Eingaben.',
    401: 'E-Mail oder Passwort ist ungültig.',
    403: 'Zugriff verweigert. Du hast keine Berechtigung.',
    404: 'Die Ressource wurde nicht gefunden.',
    408: 'Anfrage abgelaufen. Bitte versuche es erneut.',
    500: 'Serverfehler - bitte versuche es später erneut.',
    502: 'Schlechtes Gateway - der Server antwortet nicht.',
    503: 'Der Server ist momentan nicht erreichbar.',
    504: 'Verbindungszeitüberschreitung - bitte versuche es später erneut.'
  };

  return errorMessages[status] || `Ein Fehler ist aufgetreten (HTTP ${status})`;
}

// ========== API CALL FUNCTION ==========
export async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include' // wichtig für Cookies!
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(endpoint, options);

    // ===== RESPONSE PARSEN (auch bei Errors!) =====
    let responseData = null;
    try {
      responseData = await response.json();
    } catch (e) {
      // Wenn JSON-Parsing fehlschlägt, haben wir einen Netzwerk- oder Server-Fehler
      responseData = { error: getErrorMessage(response.status) };
    }

    // ===== 401 - SESSION UNGÜLTIG =====
    if (response.status === 401) {
      localStorage.removeItem('sa_user');
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('auth_token');
      
      // Error werfen, bevor wir redirect - damit kann die Login-Component reagieren
      const error = new Error(responseData.error || 'Deine Session ist abgelaufen. Bitte melde dich erneut an.');
      error.status = 401;
      error.data = responseData;
      throw error;
    }

    // ===== ANDERE FEHLER (400, 403, 500, etc.) =====
    if (!response.ok) {
      const errorMessage = responseData.error || getErrorMessage(response.status);
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = responseData;
      throw error;
    }

    // ===== SUCCESS =====
    return responseData;

  } catch (error) {
    // Netzwerkfehler (z.B. offline, CORS, Timeout)
    if (error instanceof TypeError) {
      const networkError = new Error('Netzwerkfehler - Überprüfe deine Internetverbindung');
      networkError.isNetworkError = true;
      throw networkError;
    }

    // Alle anderen Errors weitergeben
    throw error;
  }
}
