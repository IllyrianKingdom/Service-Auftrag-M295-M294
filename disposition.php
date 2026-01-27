<?php
require_once 'config.php';

setCorsHeaders();
handlePreflight();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        getAllDisposition($conn);
    } elseif ($method === 'POST') {
        if (strpos($_SERVER['REQUEST_URI'], 'update') !== false) {
            updateDisposition($conn);
        } elseif (strpos($_SERVER['REQUEST_URI'], 'delete') !== false) {
            deleteDisposition($conn);
        } else {
            createDisposition($conn);
        }
    } else {
        sendError(405, 'Method not allowed');
    }
} catch (Exception $e) {
    sendError(500, $e->getMessage());
} finally {
    $conn->close();
}

function getAllDisposition($conn) {
    $query = "
        SELECT 
            d.Disposition_id,
            d.Mitarbeiter_id,
            d.Auftrag_id,
            d.Geplanter_Termin,
            d.Status,
            d.Notiz,
            m.Name as Mitarbeiter_Name,
            a.Auftragsname
        FROM Disposition d
        LEFT JOIN Mitarbeiter m ON d.Mitarbeiter_id = m.Mitarbeiter_id
        LEFT JOIN Auftraege a ON d.Auftrag_id = a.Auftrag_id
    ";
    
    if (isset($_GET['mitarbeiter_id'])) {
        $mitarbeiter_id = (int)$_GET['mitarbeiter_id'];
        $query .= " WHERE d.Mitarbeiter_id = $mitarbeiter_id";
    }
    
    if (isset($_GET['datum'])) {
        $datum = $conn->real_escape_string($_GET['datum']);
        if (strpos($query, 'WHERE') !== false) {
            $query .= " AND DATE(d.Geplanter_Termin) = '$datum'";
        } else {
            $query .= " WHERE DATE(d.Geplanter_Termin) = '$datum'";
        }
    }
    
    $query .= " ORDER BY d.Geplanter_Termin ASC";
    
    $result = $conn->query($query);
    if (!$result) {
        sendError(500, $conn->error);
    }
    
    $dispositionen = [];
    while ($row = $result->fetch_assoc()) {
        $dispositionen[] = $row;
    }
    
    http_response_code(200);
    echo json_encode($dispositionen);
}

function createDisposition($conn) {
    $data = getJsonInput();
    
    if (!isset($data['Mitarbeiter_id']) || !isset($data['Auftrag_id'])) {
        sendError(400, 'Missing required fields: Mitarbeiter_id, Auftrag_id');
    }
    
    $mitarbeiter_id = (int)$data['Mitarbeiter_id'];
    $auftrag_id = (int)$data['Auftrag_id'];
    $geplanter_termin = $conn->real_escape_string($data['Geplanter_Termin']);
    $status = $conn->real_escape_string($data['Status'] ?? 'geplant');
    $notiz = $conn->real_escape_string($data['Notiz'] ?? '');
    
    $query = "
        INSERT INTO Disposition (Mitarbeiter_id, Auftrag_id, Geplanter_Termin, Status, Notiz)
        VALUES ($mitarbeiter_id, $auftrag_id, '$geplanter_termin', '$status', '$notiz')
    ";
    
    if (!$conn->query($query)) {
        sendError(500, $conn->error);
    }
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Disposition created successfully',
        'disposition_id' => $conn->insert_id
    ]);
}

function updateDisposition($conn) {
    $data = getJsonInput();
    
    if (!isset($data['Disposition_id'])) {
        sendError(400, 'Missing Disposition_id');
    }
    
    $disposition_id = (int)$data['Disposition_id'];
    $updates = [];
    
    $allowed_fields = ['Status', 'Geplanter_Termin', 'Notiz'];
    
    foreach ($allowed_fields as $field) {
        if (isset($data[$field])) {
            $value = $conn->real_escape_string($data[$field]);
            $updates[] = "$field = '$value'";
        }
    }
    
    if (empty($updates)) {
        sendError(400, 'No fields to update');
    }
    
    $query = "UPDATE Disposition SET " . implode(", ", $updates) . " WHERE Disposition_id = $disposition_id";
    
    if (!$conn->query($query)) {
        sendError(500, $conn->error);
    }
    
    if ($conn->affected_rows === 0) {
        sendError(404, 'Disposition not found');
    }
    
    sendSuccess([], 'Disposition updated successfully');
}

function deleteDisposition($conn) {
    $data = getJsonInput();
    
    if (!isset($data['Disposition_id'])) {
        sendError(400, 'Missing Disposition_id');
    }
    
    $disposition_id = (int)$data['Disposition_id'];
    
    $query = "DELETE FROM Disposition WHERE Disposition_id = $disposition_id";
    
    if (!$conn->query($query)) {
        sendError(500, $conn->error);
    }
    
    if ($conn->affected_rows === 0) {
        sendError(404, 'Disposition not found');
    }
    
    sendSuccess([], 'Disposition deleted successfully');
}
?>
