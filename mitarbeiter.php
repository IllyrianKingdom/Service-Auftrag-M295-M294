<?php
require_once 'config.php';

setCorsHeaders();
handlePreflight();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        getAllMitarbeiter($conn);
    } elseif ($method === 'POST') {
        if (strpos($_SERVER['REQUEST_URI'], 'update') !== false) {
            updateMitarbeiter($conn);
        } elseif (strpos($_SERVER['REQUEST_URI'], 'delete') !== false) {
            deleteMitarbeiter($conn);
        } else {
            createMitarbeiter($conn);
        }
    } else {
        sendError(405, 'Method not allowed');
    }
} catch (Exception $e) {
    sendError(500, $e->getMessage());
} finally {
    $conn->close();
}

function getAllMitarbeiter($conn) {
    $query = "
        SELECT 
            Mitarbeiter_id, Vorname, Name, Rolle, Status, Telefonnummer, Email
        FROM Mitarbeiter
        ORDER BY Name ASC
    ";
    
    $result = $conn->query($query);
    if (!$result) {
        sendError(500, $conn->error);
    }
    
    $mitarbeiter = [];
    while ($row = $result->fetch_assoc()) {
        $mitarbeiter[] = $row;
    }
    
    http_response_code(200);
    echo json_encode($mitarbeiter);
}

function createMitarbeiter($conn) {
    $data = getJsonInput();
    
    if (!isset($data['Name']) || !isset($data['Rolle'])) {
        sendError(400, 'Missing required fields: Name, Rolle');
    }
    
    $vorname = $conn->real_escape_string($data['Vorname'] ?? '');
    $name = $conn->real_escape_string($data['Name']);
    $rolle = $conn->real_escape_string($data['Rolle']);
    $status = $conn->real_escape_string($data['Status'] ?? 'aktiv');
    $telefonnummer = $conn->real_escape_string($data['Telefonnummer'] ?? '');
    $email = $conn->real_escape_string($data['Email'] ?? '');
    
    $query = "
        INSERT INTO Mitarbeiter (Vorname, Name, Rolle, Status, Telefonnummer, Email)
        VALUES ('$vorname', '$name', '$rolle', '$status', '$telefonnummer', '$email')
    ";
    
    if (!$conn->query($query)) {
        sendError(500, $conn->error);
    }
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Mitarbeiter created successfully',
        'mitarbeiter_id' => $conn->insert_id
    ]);
}

function updateMitarbeiter($conn) {
    $data = getJsonInput();
    
    if (!isset($data['Mitarbeiter_id'])) {
        sendError(400, 'Missing Mitarbeiter_id');
    }
    
    $mitarbeiter_id = (int)$data['Mitarbeiter_id'];
    $updates = [];
    
    $allowed_fields = ['Vorname', 'Name', 'Rolle', 'Status', 'Telefonnummer', 'Email'];
    
    foreach ($allowed_fields as $field) {
        if (isset($data[$field])) {
            $value = $conn->real_escape_string($data[$field]);
            $updates[] = "$field = '$value'";
        }
    }
    
    if (empty($updates)) {
        sendError(400, 'No fields to update');
    }
    
    $query = "UPDATE Mitarbeiter SET " . implode(", ", $updates) . " WHERE Mitarbeiter_id = $mitarbeiter_id";
    
    if (!$conn->query($query)) {
        sendError(500, $conn->error);
    }
    
    if ($conn->affected_rows === 0) {
        sendError(404, 'Mitarbeiter not found');
    }
    
    sendSuccess([], 'Mitarbeiter updated successfully');
}

function deleteMitarbeiter($conn) {
    $data = getJsonInput();
    
    if (!isset($data['Mitarbeiter_id'])) {
        sendError(400, 'Missing Mitarbeiter_id');
    }
    
    $mitarbeiter_id = (int)$data['Mitarbeiter_id'];
    
    $query = "DELETE FROM Mitarbeiter WHERE Mitarbeiter_id = $mitarbeiter_id";
    
    if (!$conn->query($query)) {
        sendError(500, $conn->error);
    }
    
    if ($conn->affected_rows === 0) {
        sendError(404, 'Mitarbeiter not found');
    }
    
    sendSuccess([], 'Mitarbeiter deleted successfully');
}
?>
