<?php
// ⚠️ MUST BE FIRST - vor everything!
session_start();

require_once 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'error' => 'Ungültige Anfragemethode']));
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email']) || !isset($input['password'])) {
    http_response_code(400);
    die(json_encode(['success' => false, 'error' => 'E-Mail und Passwort sind erforderlich']));
}

$email = trim($input['email']);
$password = $input['password'];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'error' => 'Die E-Mail-Adresse ist ungültig']));
}

if (strlen($password) === 0) {
    http_response_code(400);
    die(json_encode(['success' => false, 'error' => 'Das Passwort darf nicht leer sein']));
}

try {
    $conn = getDBConnection();
    
    // User MIT ROLLE aus DB holen
    $stmt = $conn->prepare('
        SELECT u.id, u.email, u.password_hash, u.name, r.name as role_name 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.email = :email 
        LIMIT 1
    ');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        die(json_encode(['success' => false, 'error' => 'E-Mail oder Passwort ist ungültig']));
    }
    
    // Session Daten speichern INKL. ROLLE
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['name'] = $user['name'];
    $_SESSION['user_role'] = $user['role_name']; // ← NEU: Rolle in Session
    
    // httpOnly Cookie setzen
    setcookie('session_id', session_id(), [
        'expires' => time() + (24 * 60 * 60),
        'path' => '/',
        'httponly' => true,
        'secure' => false,
        'samesite' => 'Lax'
    ]);
    
    // Token für Frontend
    $token = bin2hex(random_bytes(32));
    
    http_response_code(200);
    die(json_encode([
        'success' => true,
        'message' => 'Login erfolgreich',
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role_name']  // ← NEU: Rolle an Frontend
        ],
        'token' => $token
    ]));
    
} catch (Exception $e) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'error' => 'Ein Serverfehler ist aufgetreten. Bitte versuche es später erneut.'
    ]));
}
?>
