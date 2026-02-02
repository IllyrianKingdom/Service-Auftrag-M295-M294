<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'error' => 'Method not allowed']));
}

// Session aufräumen
session_destroy();

// Cookie löschen
setcookie('session_id', '', [
    'expires' => time() - 3600,
    'path' => '/',
    'httponly' => true,
    'secure' => false,
    'samesite' => 'Lax'
]);

http_response_code(200);
die(json_encode(['success' => true, 'message' => 'Logged out successfully']));
?>
