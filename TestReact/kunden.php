<?php
// ============ CORS HEADERS (MUST BE FIRST!) ============
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ============ REST OF YOUR CODE ============
require_once 'config.php';

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
    $conn = null;
}

function getAllKunden($conn) {
    $query = "
        SELECT 
        kunden_id, vorname, name, firma, addresse, plz, ort, telefonnummer
        FROM Kunde
        ORDER BY firma ASC, name ASC
    ";

    $stmt = $conn->prepare($query);
    if (!$stmt->execute()) {
        sendError(500, 'Database query failed');
    }

    $kunden = $stmt->fetchAll();
    http_response_code(200);
    echo json_encode($kunden);
}

function getKundenById($conn, $id) {
    $stmt = $conn->prepare("SELECT * FROM Kunde WHERE kunden_id = :id");
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);

    if (!$stmt->execute()) {
        sendError(500, 'Execute failed');
    }

    $result = $stmt->fetch();
    if (!$result) {
        sendError(404, 'Kunde not found');
    }

    http_response_code(200);
    echo json_encode($result);
}

function createKunden($conn) {
    $data = getJsonInput();

    if (!isset($data['Name']) || !isset($data['Firma'])) {
        sendError(400, 'Missing required fields: Name, Firma');
    }

    $stmt = $conn->prepare("
        INSERT INTO Kunde (vorname, name, firma, addresse, plz, ort, telefonnummer)
        VALUES (:vorname, :name, :firma, :addresse, :plz, :ort, :telefonnummer)
    ");

    $vorname = $data['Vorname'] ?? '';
    $name = $data['Name'];
    $firma = $data['Firma'];
    $addresse = $data['Addresse'] ?? '';
    $plz = $data['PLZ'] ?? '';
    $ort = $data['Ort'] ?? '';
    $telefonnummer = $data['Telefonnummer'] ?? '';

    $stmt->bindParam(':vorname', $vorname);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':firma', $firma);
    $stmt->bindParam(':addresse', $addresse);
    $stmt->bindParam(':plz', $plz);
    $stmt->bindParam(':ort', $ort);
    $stmt->bindParam(':telefonnummer', $telefonnummer);

    if (!$stmt->execute()) {
        sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
    }

    $insertId = $conn->lastInsertId('Kunde_kunden_id_seq');
    sendCreated($insertId, 'Kunde created successfully');
}

function updateKunden($conn) {
    $data = getJsonInput();

    if (!isset($data['Kunden_id'])) {
        sendError(400, 'Missing Kunden_id');
    }

    $fields = [];
    $bindings = [];
    $allowed = ['Vorname', 'Name', 'Firma', 'Addresse', 'PLZ', 'Ort', 'Telefonnummer'];

    foreach ($allowed as $field) {
        if (isset($data[$field])) {
            $fields[] = strtolower($field) . " = :" . strtolower($field);
            $bindings[':' . strtolower($field)] = $data[$field];
        }
    }

    if (empty($fields)) {
        sendError(400, 'No fields to update');
    }

    $query = "UPDATE Kunde SET " . implode(", ", $fields) . " WHERE kunden_id = :id";
    $stmt = $conn->prepare($query);

    $bindings[':id'] = (int)$data['Kunden_id'];

    if (!$stmt->execute($bindings)) {
        sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
    }

    if ($stmt->rowCount() === 0) {
        sendError(404, 'Kunde not found');
    }

    sendSuccess([], 'Kunde updated successfully');
}

function deleteKunden($conn) {
    $data = getJsonInput();

    if (!isset($data['Kunden_id'])) {
        sendError(400, 'Missing Kunden_id');
    }

    $stmt = $conn->prepare("DELETE FROM Kunde WHERE kunden_id = :id");
    $stmt->bindParam(':id', $data['Kunden_id'], PDO::PARAM_INT);

    if (!$stmt->execute()) {
        sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
    }

    if ($stmt->rowCount() === 0) {
        sendError(404, 'Kunde not found');
    }

    sendSuccess([], 'Kunde deleted successfully');
}

?>