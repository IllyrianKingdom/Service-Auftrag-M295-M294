<?php
// ========== CORS PROXY ==========
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ========== PROXY REQUEST ==========
$action = $_GET['action'] ?? $_POST['action'] ?? 'get';

if ($action === 'get') {
    // Get auftraege - call your internal API
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://localhost/api/auftraege.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    http_response_code($http_code);
    echo $response;
    exit;
}

// Handle other actions similarly...
?>
