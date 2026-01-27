<?php
require_once 'config.php';

setCorsHeaders();
handlePreflight();

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        getAllVerrechnungen($conn);
    } elseif ($method === 'POST') {
        if (strpos($_SERVER['REQUEST_URI'], 'update') !== false) {
            updateVerrechnung($conn);
        } elseif (strpos($_SERVER['REQUEST_URI'], 'delete') !== false) {
            deleteVerrechnung($conn);
        } else {
            createVerrechnung($conn);
        }
    } else {
        sendError(405, 'Method not allowed');
    }
} catch (Exception $e) {
    sendError(500, $e->getMessage());
} finally {
    $conn->close();
}

function getAllVerrechnungen($conn) {
    $query = "
        SELECT 
            v.Verrechnungen_id,
            v.Auftrag_id,
            v.Rechnungsdatum,
            v.Betrag,
            v.Status,
            v.Bemerkung,
            a.Auftragsname,
            k.Firma,
            k.Name,
            k.Vorname
        FROM Verrechnungen v
        LEFT JOIN Auftraege a ON v.Auftrag_id = a.Auftrag_id
        LEFT JOIN Kunde k ON a.Kunden_id = k.Kunden_id
    ";
    
    if (isset($_GET['status'])) {
        $status = $conn->real_escape_string($_GET['status']);
        $query .= " WHERE v.Status = '$status'";
    }
    
    $query .= " ORDER BY v.Rechnungsdatum DESC";
    
    $result = $conn->query($query);
    if (!$result) {
        sendError(500, $conn->error);
    }
    
    $verrechnungen = [];
    while ($row = $result->fetch_assoc()) {
        $verrechnungen[] = $row;
    }
    
    http_response_code(200);
    echo json_encode($verrechnungen);
}

function createVerrechnung($conn) {
    $data = getJsonInput();
    
    if (!isset($data['Auftrag_id']) || !isset($data['Betrag'])) {
        sendError(400, 'Missing required fields: Auftrag_id, Betrag');
    }
    
    $auftrag_id = (int)$data['Auftrag_id'];
    $rechnungsdatum = $conn->real_escape_string($data['Rechnungsdatum'] ?? date('Y-m-d'));
    $betrag = (float)$data['Betrag'];
    $status = $conn->real_escape_string($data['Status'] ?? 'offen');
    $bemerkung = $conn->real_escape_string($data['Bemerkung'] ?? '');
    
    $query = "
        INSERT INTO Verrechnungen (Auftrag_id, Rechnungsdatum, Betrag, Status, Bemerkung)
        VALUES ($auftrag_id, '$rechnungsdatum', $betrag, '$status', '$bemerkung')
    ";
    
    if (!$conn->query($query)) {
        sendError(500, $conn->error);
    }
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Verrechnung created successfully',
        'verrechnungen_id' => $conn->insert_id
    ]);
}

function updateVerrechnung($conn) {
    $data = getJsonInput();
    
    if (!isset($data['Verrechnungen_id'])) {
        sendError(400, 'Missing Verrechnungen_id');
    }
    
    $verrechnungen_id = (int)$data['Verrechnungen_id'];
    $updates = [];
    
    $allowed_fields = ['Status', 'Betrag', 'Bemerkung'];
    
    foreach ($allowed_fields as $field) {
        if (isset($data[$field])) {
            if ($field === 'Betrag') {
                $value = (float)$data[$field];
            } else {
                $value = "'" . $conn->real_escape_string($data[$field]) . "'";
            }
            $updates[] = "$field = $value";
        }
    }
    
    if (empty($updates)) {
        sendError(400, 'No fields to update');
    }
    
    $query = "UPDATE Verrechnungen SET " . implode(", ", $updates) . " WHERE Verrechnungen_id = $verrechnungen_id";
    
    if (!$conn->query($query)) {
        sendError(500, $conn->error);
    }
    
    if ($conn->affected_rows === 0) {
        sendError(404, 'Verrechnung not found');
    }
    
    sendSuccess([], 'Verrechnung updated successfully');
}

function deleteVerrechnung($conn) {
    $data = getJsonInput();
    
    if (!isset($data['Verrechnungen_id'])) {
        sendError(400, 'Missing Verrechnungen_id');
    }
    
    $verrechnungen_id = (int)$data['Verrechnungen_id'];
    
    $query = "DELETE FROM Verrechnungen WHERE Verrechnungen_id = $verrechnungen_id";
    
    if (!$conn->query($query)) {
        sendError(500, $conn->error);
    }
    
    if ($conn->affected_rows === 0) {
        sendError(404, 'Verrechnung not found');
    }
    
    sendSuccess([], 'Verrechnung deleted successfully');
}
?>
