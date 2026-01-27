<?php
require_once 'config.php';

setCorsHeaders();
handlePreflight();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        getAllAuftraege($conn);
    } elseif ($method === 'POST') {
        if (strpos($_SERVER['REQUEST_URI'], 'update') !== false) {
            updateAuftrag($conn);
        } elseif (strpos($_SERVER['REQUEST_URI'], 'delete') !== false) {
            deleteAuftrag($conn);
        } else {
            createAuftrag($conn);
        }
    } else {
        sendError(405, 'Method not allowed');
    }
} catch (Exception $e) {
    sendError(500, $e->getMessage());
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
        sendError(500, $conn->error);
    }
    
    $auftraege = [];
    while ($row = $result->fetch_assoc()) {
        $auftraege[] = $row;
    }
    
    http_response_code(200);
    echo json_encode($auftraege);
}

function createAuftrag($conn) {
    $data = getJsonInput();
    
    if (!isset($data['Auftragsname']) || !isset($data['Kunden_id'])) {
        sendError(400, 'Missing required fields: Auftragsname, Kunden_id');
    }
    
    $auftragsname = $conn->real_escape_string($data['Auftragsname']);
    $kunden_id = (int)$data['Kunden_id'];
    $status = $conn->real_escape_string($data['Status'] ?? 'erfasst');
    $angefangen_am = $conn->real_escape_string($data['Angefangen_am'] ?? date('Y-m-d'));
    $erfasst_von = (int)($data['Erfasst_von'] ?? 1);
    
    $query = "
        INSERT INTO Auftraege (
            Auftragsname, Kunden_id, Status, Angefangen_am, Erfasst_von, Erfasst_am
        ) VALUES (
            '$auftragsname', $kunden_id, '$status', '$angefangen_am', $erfasst_von, NOW()
        )
    ";
    
    if (!$conn->query($query)) {
        sendError(500, $conn->error);
    }
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Auftrag created successfully',
        'auftrag_id' => $conn->insert_id
    ]);
}

function updateAuftrag($conn) {
    $data = getJsonInput();
    
    if (!isset($data['Auftrag_id']) || !isset($data['Status'])) {
        sendError(400, 'Missing required fields: Auftrag_id, Status');
    }
    
    $auftrag_id = (int)$data['Auftrag_id'];
    $status = $conn->real_escape_string($data['Status']);
    $erledigt_am = isset($data['Erledigt_am']) ? "'" . $conn->real_escape_string($data['Erledigt_am']) . "'" : "NULL";
    
    $query = "
        UPDATE Auftraege
        SET Status = '$status', Erledigt_am = $erledigt_am
        WHERE Auftrag_id = $auftrag_id
    ";
    
    if (!$conn->query($query)) {
        sendError(500, $conn->error);
    }
    
    if ($conn->affected_rows === 0) {
        sendError(404, 'Auftrag not found');
    }
    
    sendSuccess([], 'Auftrag updated successfully');
}

function deleteAuftrag($conn) {
    $data = getJsonInput();
    
    if (!isset($data['Auftrag_id'])) {
        sendError(400, 'Missing Auftrag_id');
    }
    
    $auftrag_id = (int)$data['Auftrag_id'];
    
    $query = "DELETE FROM Auftraege WHERE Auftrag_id = $auftrag_id";
    
    if (!$conn->query($query)) {
        sendError(500, $conn->error);
    }
    
    if ($conn->affected_rows === 0) {
        sendError(404, 'Auftrag not found');
    }
    
    sendSuccess([], 'Auftrag deleted successfully');
}
?>
