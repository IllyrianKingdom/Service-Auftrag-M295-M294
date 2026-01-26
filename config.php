<?php
/**
 * Database Configuration für Supabase PostgreSQL via REST API
 * Alternative: Nutze Supabase REST API statt direkter DB Connection
 * Das funktioniert auf jedem Server!
 */

ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../error.log');

// Supabase REST API Credentials
$supabase_url = 'https://mgxaqgxtwuuczouvrzjb.supabase.co';
$supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1neGFxZ3h0d3V1Y3pvdXZyempiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjUwNjMsImV4cCI6MjA4Mzk0MTA2M30.KgV4A1G88vU_Ur457UpLx-LU3VAB2T5hcWKJrDiv8bM'; // UPDATE THIS!

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Helper Function: Supabase API aufrufen
 */
function supabase_call($table, $method = 'GET', $data = null, $query = '') {
    global $supabase_url, $supabase_key;
    
    $url = "{$supabase_url}/rest/v1/{$table}" . ($query ? "?{$query}" : "");
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $supabase_key,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ]);
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'status' => $http_code,
        'data' => json_decode($response, true)
    ];
}
?>