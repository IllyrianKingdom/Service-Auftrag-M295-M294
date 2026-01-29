<?php
require_once 'config.php';

// Handle nur POST requests
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
        // WICHTIG: Gleiche Error-Message wie bei falschem Passwort (Sicherheit!)
        http_response_code(401);
        die(json_encode(['success' => false, 'error' => 'Invalid email or password']));
    }
    
    // Passwort mit Hash vergleichen (password_verify ist sicher!)
    if (!password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        die(json_encode(['success' => false, 'error' => 'Invalid email or password']));
    }
    
    // Session starten und Benutzer-ID speichern
    session_start();
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['name'] = $user['name'];
    
    // httpOnly Cookie setzen (besser als localStorage!)
    setcookie('session_id', session_id(), [
        'expires' => time() + (24 * 60 * 60), // 24 Stunden
        'path' => '/',
        'httponly' => true,
        'secure' => true, // Nur über HTTPS
        'samesite' => 'Lax'
    ]);
    
    // Token für Frontend (zusätzlich zur Session)
    $token = bin2hex(random_bytes(32)); // Sicherer Token
    
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
    die(json_encode(['success' => false, 'error' => 'Server error']));
}
?>
