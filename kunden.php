<?php
require_once 'config.php';

setCorsHeaders();
handlePreflight();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            getKundenById($conn, $_GET['id']);
        } else {
            getAllKunden($conn);
        }
    } elseif ($method === 'POST') {
        if (strpos($_SERVER['REQUEST_URI'], 'update') !== false) {
            updateKunden($conn);
        } elseif (strpos($_SERVER['REQUEST_URI'], 'delete') !== false) {
            deleteKunden($conn);
        } else {
            createKunden($conn);
        }
    } else {
        sendError(405, 'Method not allowed');
    }
} catch (Exception $e) {
    sendError(500, $e->getMessage());
} finally {
    $conn->close();
}

function getAllKunden($conn) {
    $query = "
        SELECT 
            Kunden_id, Vorname, Name, Firma, Addresse, PLZ, Ort, Telefonnummer
        FROM Kunde
        ORDER BY Firma ASC, Name ASC
    ";
    
    $result = $conn->query($query);
    if (!$result) {
        sendError(500, $conn->error);
    }
    
    $kunden = [];
    while ($row = $result->fetch_assoc()) {
        $kunden[] = $row;
    }
    
    http_response_code(200);
    echo json_encode($kunden);
}

function getKundenById($conn, $id) {
    $kunden_id = (int)$id;
    
    $query = "SELECT * FROM Kunde WHERE Kunden_id = $kunden_id";
    $result = $conn->query($query);
    
    if (!$result || $result->num_rows === 0) {
        sendError(404, 'Kunde not found');
    }
    
    http_response_code(200);
    echo json_encode($result->fetch_assoc());
}

function createKunden($conn) {
    $data = getJsonInput();
    
    if (!isset($data['Name']) || !isset($data['Firma'])) {
        sendError(400, 'Missing required fields: Name, Firma');
    }
    
    $vorname = $conn->real_escape_string($data['Vorname'] ?? '');
    $name = $conn->real_escape_string($data['Name']);
    $firma = $conn->real_escape_string($data['Firma']);
    $addresse = $conn->real_escape_string($data['Addresse'] ?? '');
    $plz = $conn->real_escape_string($data['PLZ'] ?? '');
    $ort = $conn->real_escape_string($data['Ort'] ?? '');
    $telefonnummer = $conn->real_escape_string($data['Telefonnummer'] ?? '');
    
    $query = "
        INSERT INTO Kunde (Vorname, Name, Firma, Addresse, PLZ, Ort, Telefonnummer)
        VALUES ('$vorname', '$name', '$firma', '$addresse', '$plz', '$ort', '$telefonnummer')
    ";
    
    if (!$conn->query($query)) {
        sendError(500, $conn->error);
    }
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Kunde created successfully',
        'kunden_id' => $conn->insert_id
    ]);
}

function updateKunden($conn) {
    $data = getJsonInput();
    
    if (!isset($data['Kunden_id'])) {
        sendError(400, 'Missing Kunden_id');
    }
    
    $kunden_id = (int)$data['Kunden_id'];
    $updates = [];
    
    $allowed_fields = ['Vorname', 'Name', 'Firma', 'Addresse', 'PLZ', 'Ort', 'Telefonnummer'];
    
    foreach ($allowed_fields as $field) {
        if (isset($data[$field])) {
            $value = $conn->real_escape_string($data[$field]);
            $updates[] = "$field = '$value'";
        }
    }
    
    if (empty($updates)) {
        sendError(400, 'No fields to update');
    }
    
    $query = "UPDATE Kunde SET " . implode(", ", $updates) . " WHERE Kunden_id = $kunden_id";
    
    if (!$conn->query($query)) {
        sendError(500, $conn->error);
    }
    
    if ($conn->affected_rows === 0) {
        sendError(404, 'Kunde not found');
    }
    
    sendSuccess([], 'Kunde updated successfully');
}

function deleteKunden($conn) {
    $data = getJsonInput();
    
    if (!isset($data['Kunden_id'])) {
        sendError(400, 'Missing Kunden_id');
    }
    
    $kunden_id = (int)$data['Kunden_id'];
    
    $query = "DELETE FROM Kunde WHERE Kunden_id = $kunden_id";
    
    if (!$conn->query($query)) {
        sendError(500, $conn->error);
    }
    
    if ($conn->affected_rows === 0) {
        sendError(404, 'Kunde not found');
    }
    
    sendSuccess([], 'Kunde deleted successfully');
}
?>
