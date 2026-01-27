<?php
require_once 'config.php';

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
    $conn = null;
}

function getAllMitarbeiter($conn) {
    $query = "
        SELECT 
        mitarbeiter_id, vorname, name, rolle, status, telefonnummer, email
        FROM Mitarbeiter
        ORDER BY name ASC
    ";

    $stmt = $conn->prepare($query);
    if (!$stmt->execute()) {
        sendError(500, 'Database query failed');
    }

    $mitarbeiter = $stmt->fetchAll();
    http_response_code(200);
    echo json_encode($mitarbeiter);
}

function createMitarbeiter($conn) {
    $data = getJsonInput();

    if (!isset($data['Name']) || !isset($data['Rolle'])) {
        sendError(400, 'Missing required fields: Name, Rolle');
    }

    $stmt = $conn->prepare("
        INSERT INTO Mitarbeiter (vorname, name, rolle, status, telefonnummer, email)
        VALUES (:vorname, :name, :rolle, :status, :telefonnummer, :email)
    ");

    $vorname = $data['Vorname'] ?? '';
    $name = $data['Name'];
    $rolle = $data['Rolle'];
    $status = $data['Status'] ?? 'aktiv';
    $telefonnummer = $data['Telefonnummer'] ?? '';
    $email = $data['Email'] ?? '';

    $stmt->bindParam(':vorname', $vorname);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':rolle', $rolle);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':telefonnummer', $telefonnummer);
    $stmt->bindParam(':email', $email);

    if (!$stmt->execute()) {
        sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
    }

    // Get the last insert id for PostgreSQL
    $insertId = $conn->lastInsertId('Mitarbeiter_mitarbeiter_id_seq');
    sendCreated($insertId, 'Mitarbeiter created successfully');
}

function updateMitarbeiter($conn) {
    $data = getJsonInput();

    if (!isset($data['Mitarbeiter_id'])) {
        sendError(400, 'Missing Mitarbeiter_id');
    }

    // Build dynamic fields
    $fields = [];
    $bindings = [];
    $allowed = ['Vorname', 'Name', 'Rolle', 'Status', 'Telefonnummer', 'Email'];

    foreach ($allowed as $field) {
        if (isset($data[$field])) {
            $fields[] = strtolower($field) . " = :" . strtolower($field);
            $bindings[':' . strtolower($field)] = $data[$field];
        }
    }

    if (empty($fields)) {
        sendError(400, 'No fields to update');
    }

    $query = "UPDATE Mitarbeiter SET " . implode(", ", $fields) . " WHERE mitarbeiter_id = :id";
    $stmt = $conn->prepare($query);

    $bindings[':id'] = (int)$data['Mitarbeiter_id'];

    if (!$stmt->execute($bindings)) {
        sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
    }

    if ($stmt->rowCount() === 0) {
        sendError(404, 'Mitarbeiter not found');
    }

    sendSuccess([], 'Mitarbeiter updated successfully');
}

function deleteMitarbeiter($conn) {
    $data = getJsonInput();

    if (!isset($data['Mitarbeiter_id'])) {
        sendError(400, 'Missing Mitarbeiter_id');
    }

    $stmt = $conn->prepare("DELETE FROM Mitarbeiter WHERE mitarbeiter_id = :id");
    $stmt->bindParam(':id', $data['Mitarbeiter_id'], PDO::PARAM_INT);

    if (!$stmt->execute()) {
        sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
    }

    if ($stmt->rowCount() === 0) {
        sendError(404, 'Mitarbeiter not found');
    }

    sendSuccess([], 'Mitarbeiter deleted successfully');
}

?>