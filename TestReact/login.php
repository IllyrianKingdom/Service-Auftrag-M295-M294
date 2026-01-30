<?php
// ⚠️ MUST BE FIRST - vor everything!
session_start();

// Dann config laden
require_once 'config.php';

// Jetzt erst die Logik
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'error' => 'Method not allowed']));
}

// JSON Input parsen
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email']) || !isset($input['password'])) {
    http_response_code(400);
    die(json_encode(['success' => false, 'error' => 'Email and password required']));
}

$email = trim($input['email']);
$password = $input['password'];

// Validierung
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'error' => 'Invalid email format']));
}

if (strlen($password) === 0) {
    http_response_code(400);
    die(json_encode(['success' => false, 'error' => 'Password cannot be empty']));
}

try {
    $conn = getDBConnection();
    
    // User in DB suchen
    $stmt = $conn->prepare('SELECT id, email, password_hash, name FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(401);
        die(json_encode(['success' => false, 'error' => 'Invalid email or password']));
    }
    
    // Passwort mit Hash vergleichen
    if (!password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        die(json_encode(['success' => false, 'error' => 'Invalid email or password']));
    }
    
    // Session Daten speichern
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['name'] = $user['name'];
    
    // httpOnly Cookie setzen
    setcookie('session_id', session_id(), [
        'expires' => time() + (24 * 60 * 60),
        'path' => '/',
        'httponly' => true,
        'secure' => false, // ⚠️ true nur mit HTTPS!
        'samesite' => 'Lax'
    ]);
    
    // Token für Frontend
    $token = bin2hex(random_bytes(32));
    
    http_response_code(200);
    die(json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name']
        ],
        'token' => $token
    ]));
    
} catch (Exception $e) {
    http_response_code(500);
    die(json_encode(['success' => false, 'error' => 'Server error', 'debug' => $e->getMessage()]));
}
?>
