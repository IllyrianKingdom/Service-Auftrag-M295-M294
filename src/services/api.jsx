// src/services/api.jsx

// ========== API CONFIG ==========
const API_BASE = 'http://localhost/TestReact';

export const API_ENDPOINTS = {
  mitarbeiter: `${API_BASE}/mitarbeiter.php`,
  kunden: `${API_BASE}/kunden.php`,
  auftraege: `${API_BASE}/auftraege.php`,
  disposition: `${API_BASE}/disposition.php`,
  rapportieren: `${API_BASE}/rapportieren.php`,
  verrechnung: `${API_BASE}/verrechnung.php`,
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
    const json = await response.json();

    // ========== RESPONSE HANDLING ==========
    // GET Requests: Returns array directly
    if (method === 'GET') {
      if (!response.ok) {
        throw new Error(json.error || 'Failed to fetch data');
      }
      return Array.isArray(json) ? json : [];
    }

    // POST/PUT/DELETE Requests: Returns { success: true, data: ... }
    if (!response.ok || !json.success) {
      throw new Error(json.error || 'API request failed');
    }

    return json;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}