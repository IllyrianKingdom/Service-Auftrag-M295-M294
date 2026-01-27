<?php
// ========== SUPABASE POSTGRESQL DATABASE CONFIGURATION ==========
define('DB_HOST', 'aws-1-eu-central-1.pooler.supabase.com');
define('DB_USER', 'postgres.kemkyxpxvpxikuusrubo');
define('DB_PASS', 'VedranAlessioArnis');
define('DB_NAME', 'postgres');
define('DB_PORT', 5432);

// ========== CORS HEADERS & SECURITY ==========
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// ========== PREFLIGHT REQUEST HANDLING ==========
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ========== DATABASE CONNECTION (PDO with PostgreSQL) ==========
function getDBConnection() {
    try {
        // PostgreSQL Connection String for Supabase
        $dsn = 'pgsql:host=' . DB_HOST . 
               ';port=' . DB_PORT . 
               ';dbname=' . DB_NAME . 
               ';user=' . DB_USER . 
               ';password=' . DB_PASS . 
               ';sslmode=require';
        
        $conn = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_PERSISTENT => false,
        ]);
        
        return $conn;
    } catch (PDOException $e) {
        http_response_code(500);
        die(json_encode([
            'success' => false,
            'error' => 'Database connection failed',
            'message' => $e->getMessage()
        ]));
    }
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

// ========== CREATED RESPONSE ==========
function sendCreated($insertId, $message = 'Resource created successfully') {
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'id' => $insertId
    ]);
    exit();
}

?>