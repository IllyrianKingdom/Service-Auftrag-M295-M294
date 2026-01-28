<?php
// config.php - Supabase PostgreSQL Configuration

// ========== SUPABASE POSTGRESQL DATABASE ==========
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

// ========== DATABASE CONNECTION (PDO with PostgreSQL) ==========
function getDBConnection() {
    try {
        $dsn = 'pgsql:host=' . DB_HOST . 
               ';port=' . DB_PORT . 
               ';dbname=' . DB_NAME . 
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

$conn = getDBConnection();
?>