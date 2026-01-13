<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}


$users = [
    [
        'id' => 1,
        'email' => 'benutzer1@example.com',
        'password' => 'password123',
        'name' => 'Benutzer 1'
    ],
    [
        'id' => 2,
        'email' => 'benutzer2@example.com',
        'password' => 'password123',
        'name' => 'Benutzer 2'
    ],
    [
        'id' => 3,
        'email' => 'benutzer3@example.com',
        'password' => 'password123',
        'name' => 'Benutzer 3'
    ],
    [
        'id' => 4,
        'email' => 'benutzer4@example.com',
        'password' => 'password123',
        'name' => 'Benutzer 4'
    ]
];

$action = $_GET['action'] ?? '';

// ANMELDEN
if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $email = filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $password = $input['password'] ?? '';
    
    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Email und Passwort erforderlich']);
        exit();
    }
    
    // Suche Benutzer in der Liste
    foreach ($users as $user) {
        if ($user['email'] === $email && $user['password'] === $password) {
            http_response_code(200);
            echo json_encode([
                'success' => 'Anmeldung erfolgreich',
                'user_id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name']
            ]);
            exit();
        }
    }
    
    http_response_code(401);
    echo json_encode(['error' => 'Email oder Passwort falsch']);
}

else {
    http_response_code(400);
    echo json_encode(['error' => 'Ungültige Anfrage']);
}
?>
