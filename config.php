<?php
// ========== ZENTRALE KONFIGURATION ==========
define('DB_HOST', 'sql100.infinityfree.com');
define('DB_USER', 'if0_40887821');
define('DB_PASS', 'DQmbqjTwHBU');
define('DB_NAME', 'if0_40887821_avadb');
define('DB_PORT', 3306);

// ========== CORS HEADERS (UNIVERSAL) ==========
function setCorsHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');
}

// ========== PREFLIGHT REQUEST HANDLING ==========
function handlePreflight() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// ========== DATABASE CONNECTION ==========
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
    
    if ($conn->connect_error) {
        http_response_code(500);
        die(json_encode([
            'error' => 'Database connection failed',
            'message' => $conn->connect_error
        ]));
    }
    
    $conn->set_charset("utf8mb4");
    return $conn;
}

// ========== JSON INPUT HELPER ==========
function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true);
}

// ========== ERROR RESPONSE ==========
function sendError($code, $message) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message
    ]);
    exit();
}

// ========== SUCCESS RESPONSE ==========
function sendSuccess($data = [], $message = 'Success') {
    http_response_code(200);
    echo json_encode(array_merge([
        'success' => true,
        'message' => $message
    ], $data));
    exit();
}
?>
