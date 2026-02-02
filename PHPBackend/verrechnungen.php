<?php
session_start();
header('Content-Type: application/json; charset=utf-8');  // charset HINZ
require_once 'config.php';

// ============ HELPER FUNCTIONS ============
function getJsonInput() {
    $input = file_get_contents('php://input');
    if (empty($input)) {
        sendError(400, 'Empty request body');
    }
    $data = json_decode($input, true);
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        sendError(400, 'Invalid JSON: ' . json_last_error_msg());
    }
    return $data;
}

function sendError($code, $message) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message
    ]);
    exit();
}

function sendSuccess($data = [], $message = 'Success') {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

function sendCreated($id, $message = 'Created') {
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => ['id' => $id]
    ]);
    exit();
}

// ============ MAIN ROUTER ============
try {
    $pdo = getDBConnection();
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        getAllVerrechnungen($pdo);
    } elseif ($method === 'POST') {
        $query = $_SERVER['QUERY_STRING'] ?? '';
        
        if (strpos($query, 'delete') !== false) {
            deleteVerrechnung($pdo);
        } elseif (strpos($query, 'update') !== false) {
            updateVerrechnung($pdo);
        } else {
            createVerrechnung($pdo);
        }
    } else {
        sendError(405, 'Method not allowed');
    }
} catch (Exception $e) {
    sendError(500, 'Server error: ' . $e->getMessage());
} finally {
    $pdo = null;
}

// ============ GET ALL VERRECHNUNGEN ============
function getAllVerrechnungen($pdo) {
    $query = "
        SELECT 
            v.verrechnung_id,
            v.auftrag_id,
            v.kunden_id,
            v.rechnungsdatum,
            v.betrag,
            v.status,
            v.bemerkung,
            a.auftragsname,
            k.vorname,
            k.name,
            k.firma
        FROM verrechnungen v
        LEFT JOIN auftraege a ON v.auftrag_id = a.auftrag_id
        LEFT JOIN kunde k ON v.kunden_id = k.kunden_id
        ORDER BY v.rechnungsdatum DESC
    ";

    try {
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $verrechnungen = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($verrechnungen);
        exit();
    } catch (PDOException $e) {
        sendError(500, 'Query failed: ' . $e->getMessage());
    }
}

// ============ CREATE VERRECHNUNG ============
function createVerrechnung($pdo) {
    $data = getJsonInput();

    // Validation
    if (empty($data['Auftrag_id']) || empty($data['Betrag']) || empty($data['Kunden_id'])) {
        sendError(400, 'Missing required fields: Auftrag_id, Kunden_id, Betrag');
    }

    $auftrag_id = (int)$data['Auftrag_id'];
    $kunden_id = (int)$data['Kunden_id'];
    $rechnungsdatum = $data['Rechnungsdatum'] ?? date('Y-m-d');
    $betrag = (float)$data['Betrag'];
    $status = $data['Status'] ?? 'offen';
    $bemerkung = $data['Bemerkung'] ?? '';

    $sql = "INSERT INTO verrechnungen 
            (auftrag_id, kunden_id, rechnungsdatum, betrag, status, bemerkung) 
            VALUES (:auftrag_id, :kunden_id, :rechnungsdatum, :betrag, :status, :bemerkung)";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':auftrag_id' => $auftrag_id,
            ':kunden_id' => $kunden_id,
            ':rechnungsdatum' => $rechnungsdatum,
            ':betrag' => $betrag,
            ':status' => $status,
            ':bemerkung' => $bemerkung
        ]);
        
        sendCreated($pdo->lastInsertId(), 'Verrechnung created successfully');
    } catch (PDOException $e) {
        sendError(500, 'Insert failed: ' . $e->getMessage());
    }
}

// ============ UPDATE VERRECHNUNG ============
function updateVerrechnung($pdo) {
    $data = getJsonInput();

    if (empty($data['Verrechnung_id'])) {
        sendError(400, 'Missing Verrechnung_id');
    }

    $verrechnung_id = (int)$data['Verrechnung_id'];
    $updates = [];
    $bindings = [':id' => $verrechnung_id];

    // Allowed fields to update
    $allowed = ['Status', 'Betrag', 'Bemerkung'];
    foreach ($allowed as $field) {
        if (isset($data[$field])) {
            $updates[] = strtolower($field) . ' = :' . strtolower($field);
            $bindings[':' . strtolower($field)] = $data[$field];
        }
    }

    if (empty($updates)) {
        sendError(400, 'No fields to update');
    }

    $sql = "UPDATE verrechnungen SET " . implode(', ', $updates) . " WHERE verrechnung_id = :id";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($bindings);
        
        if ($stmt->rowCount() === 0) {
            sendError(404, 'Verrechnung not found');
        }
        
        sendSuccess([], 'Verrechnung updated successfully');
    } catch (PDOException $e) {
        sendError(500, 'Update failed: ' . $e->getMessage());
    }
}

// ============ DELETE VERRECHNUNG ============
function deleteVerrechnung($pdo) {
    $data = getJsonInput();

    if (empty($data['Verrechnung_id'])) {
        sendError(400, 'Missing Verrechnung_id');
    }

    $verrechnung_id = (int)$data['Verrechnung_id'];
    $sql = "DELETE FROM verrechnungen WHERE verrechnung_id = :id";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $verrechnung_id]);
        
        if ($stmt->rowCount() === 0) {
            sendError(404, 'Verrechnung not found');
        }
        
        sendSuccess([], 'Verrechnung deleted successfully');
    } catch (PDOException $e) {
        sendError(500, 'Delete failed: ' . $e->getMessage());
    }
}
?>
