<?php
/**
 * Aufträge API mit MySQL (InfinityFree)
 * Datei: /api/auftraege.php
 */

// ========== MySQL CONFIG ==========
$db_host = 'sql100.infinityfree.com';
$db_user = 'if0_40887821';
$db_pass = 'DQmbqjTwHBU'; // ← UPDATE THIS!
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

// ========== HEADERS ==========
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ========== ROUTING ==========
$method = $_SERVER['REQUEST_METHOD'];
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$route = str_replace('/api/auftraege', '', $request_uri);

try {
    if ($method === 'GET') {
        getAllAuftraege($conn);
    } elseif ($method === 'POST') {
        if (strpos($route, 'update') !== false) {
            updateAuftrag($conn);
        } elseif (strpos($route, 'delete') !== false) {
            deleteAuftrag($conn);
        } else {
            createAuftrag($conn);
        }
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

function getAllAuftraege($conn) {
    $query = "
        SELECT 
            a.Auftrag_id,
            a.Auftragsname,
            a.Angefangen_am,
            a.Erledigt_am,
            a.Status,
            a.Erfasst_am,
            a.Erfasst_von,
            a.Kunden_id,
            k.Vorname,
            k.Name,
            k.Firma,
            k.Addresse,
            k.PLZ,
            k.Ort,
            k.Telefonnummer
        FROM Auftraege a
        LEFT JOIN Kunde k ON a.Kunden_id = k.Kunden_id
        ORDER BY a.Angefangen_am DESC
    ";
    
    $result = $conn->query($query);
    
    if (!$result) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to fetch auftraege',
            'message' => $conn->error
        ]);
        return;
    }
    
    $auftraege = [];
    while ($row = $result->fetch_assoc()) {
        $auftraege[] = $row;
    }
    
    http_response_code(200);
    echo json_encode($auftraege);
}

function createAuftrag($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['Auftragsname']) || !isset($data['Kunden_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }
    
    $auftragsname = $conn->real_escape_string($data['Auftragsname']);
    $kunden_id = (int)$data['Kunden_id'];
    $status = $conn->real_escape_string($data['Status'] ?? 'erfasst');
    $angefangen_am = $conn->real_escape_string($data['Angefangen_am'] ?? date('Y-m-d'));
    $erfasst_von = (int)($data['Erfasst_von'] ?? 1);
    
    $query = "
        INSERT INTO Auftraege (
            Auftragsname,
            Kunden_id,
            Status,
            Angefangen_am,
            Erfasst_von,
            Erfasst_am
        ) VALUES (
            '$auftragsname',
            $kunden_id,
            '$status',
            '$angefangen_am',
            $erfasst_von,
            NOW()
        )
    ";
    
    if (!$conn->query($query)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to create auftrag',
            'message' => $conn->error
        ]);
        return;
    }
    
    $auftrag_id = $conn->insert_id;
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Auftrag created successfully',
        'auftrag_id' => $auftrag_id
    ]);
}

function updateAuftrag($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['Auftrag_id']) || !isset($data['Status'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }
    
    $auftrag_id = (int)$data['Auftrag_id'];
    $status = $conn->real_escape_string($data['Status']);
    
    $query = "
        UPDATE Auftraege
        SET Status = '$status'
        WHERE Auftrag_id = $auftrag_id
    ";
    
    if (!$conn->query($query)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to update auftrag',
            'message' => $conn->error
        ]);
        return;
    }
    
    if ($conn->affected_rows === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Auftrag not found']);
        return;
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Auftrag updated successfully'
    ]);
}

function deleteAuftrag($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['Auftrag_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing Auftrag_id']);
        return;
    }
    
    $auftrag_id = (int)$data['Auftrag_id'];
    
    $query = "DELETE FROM Auftraege WHERE Auftrag_id = $auftrag_id";
    
    if (!$conn->query($query)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to delete auftrag',
            'message' => $conn->error
        ]);
        return;
    }
    
    if ($conn->affected_rows === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Auftrag not found']);
        return;
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Auftrag deleted successfully'
    ]);
}
?>