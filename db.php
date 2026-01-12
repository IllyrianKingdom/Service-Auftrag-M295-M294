<?php
// Load environment variables from .env (local development)
if (file_exists(__DIR__ . '/.env')) {
    $env = parse_ini_file(__DIR__ . '/.env');
    foreach ($env as $key => $value) {
        $_ENV[$key] = $value;
    }
}

// Get database credentials from environment variables
$db_host = $_ENV['DB_HOST'] ?? 'localhost';
$db_user = $_ENV['DB_USER'] ?? 'root';
$db_pass = $_ENV['DB_PASSWORD'] ?? '';
$db_name = $_ENV['DB_NAME'] ?? 'myapp';
$db_port = $_ENV['DB_PORT'] ?? 3306;

// Create connection using MySQLi
$mysqli = new mysqli($db_host, $db_user, $db_pass, $db_name, $db_port);

// Check connection
if ($mysqli->connect_error) {
    die('Database connection failed: ' . $mysqli->connect_error);
}

// Set charset
$mysqli->set_charset("utf8mb4");

?>
