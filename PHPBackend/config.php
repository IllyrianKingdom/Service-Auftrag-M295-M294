<?php
// config.php

$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// CORS Headers
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// OPTIONS-Request handhaben
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

define('SESSION_TIMEOUT', 30 * 60);

function validateSession() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        die(json_encode([
            'success' => false,
            'error' => 'Unauthorized',
            'message' => 'Not authenticated'
        ]));
    }

    if (isset($_SESSION['last_activity'])) {
        if ((time() - $_SESSION['last_activity']) > SESSION_TIMEOUT) {
            session_destroy();
            http_response_code(401);
            die(json_encode([
                'success' => false,
                'error' => 'Session expired',
                'message' => 'Your session has timed out'
            ]));
        }
    }

    $_SESSION['last_activity'] = time();
}

// Database Configuration
define('DB_HOST', 'aws-1-eu-central-1.pooler.supabase.com');
define('DB_USER', 'postgres.kemkyxpxvpxikuusrubo');
define('DB_PASS', 'VedranAlessioArnis');
define('DB_NAME', 'postgres');
define('DB_PORT', 5432);

function getDBConnection() {
    try {
        $dsn = 'pgsql:host=' . DB_HOST . 
               ';port=' . DB_PORT . 
               ';dbname=' . DB_NAME . 
               ';sslmode=require';
        
        $conn = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        
        return $conn;
    } catch (PDOException $e) {
        http_response_code(500);
        die(json_encode([
            'success' => false,
            'error' => 'Database connection failed',
            'debug' => $e->getMessage()
        ]));
    }
}
?>
