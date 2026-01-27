<?php
// ========== CORS HEADERS (MUST BE FIRST) ==========
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ========== MySQL CONFIG ==========
$db_host = 'sql100.infinityfree.com';
$db_user = 'if0_40887821';
$db_pass = 'DQmbqjTwHBU';
$db_name = 'if0_40887821_avadb';

// Verbindung erstellen
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode([
        'error' => 'Database connection failed',
        'message' => $conn->connect_error
    ]));
}

$conn->set_charset("utf8mb4");

// ========== ROUTING ==========
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        getAllKunden($conn);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
} finally {
    $conn->close();
}

function getAllKunden($conn) {
    $query = "
        SELECT 
            Kunden_id,
            Vorname,
            Name,
            Firma,
            Addresse,
            PLZ,
            Ort,
            Telefonnummer
        FROM Kunde
        ORDER BY Firma ASC, Name ASC
    ";
    
    $result = $conn->query($query);
    
    if (!$result) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to fetch kunden',
            'message' => $conn->error
        ]);
        return;
    }
    
    $kunden = [];
    while ($row = $result->fetch_assoc()) {
        $kunden[] = $row;
    }
    
    http_response_code(200);
    echo json_encode($kunden);
}
?>