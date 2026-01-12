<?php
// Load environment variables from .env (local development)
if (file_exists(__DIR__ . '/.env')) {
    $env = parse_ini_file(__DIR__ . '/.env');
    foreach ($env as $key => $value) {
        $_ENV[$key] = $value;
    }
}

// Get database credentials from environment variables
$db_host = $_ENV['DB_HOST'] ?? 'dpg-d5ig3qi4d50c739mha1g-a';
$db_user = $_ENV['DB_USER'] ?? 'root';
$db_pass = $_ENV['DB_PASSWORD'] ?? 'oB8m4mLGft9SKSFFNmLWMOsUJNW7U3u8';
$db_name = $_ENV['DB_NAME'] ?? 'myapp_goi3';
$db_port = $_ENV['DB_PORT'] ?? 5432;

// Create connection using PDO (PostgreSQL)
try {
    $pdo = new PDO(
        "pgsql:host=$db_host;port=$db_port;dbname=$db_name",
        $db_user,
        $db_pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    die('Database connection failed: ' . $e->getMessage());
}

?>
