<?php
require_once 'config.php';
// ============ ERROR HANDLING ============
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/var/log/php_errors.log');

// ============ HELPER FUNCTIONS ============
function getJsonInput() {
    $input = file_get_contents('php://input');
    if (empty($input)) {
        return [];
    }
    return json_decode($input, true) ?? [];
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
    $conn = getDBConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        getAllKunden($conn);
    } elseif ($method === 'POST') {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY);
        if (strpos($path, 'delete') !== false) {
            deleteKunden($conn);
        } elseif (strpos($path, 'update') !== false) {
            updateKunden($conn);
        } else {
            createKunden($conn);
        }
    } else {
        sendError(405, 'Method not allowed');
    }
} catch (Exception $e) {
    sendError(500, 'Server error: ' . $e->getMessage());
} finally {
    if (isset($conn)) {
        $conn = null;
    }
}

// ============ GET ALL KUNDEN ============
function getAllKunden($conn) {
    $query = "
        SELECT
            kunden_id, vorname, name, firma, addresse, plz, ort, telefonnummer
        FROM kunde
        ORDER BY firma ASC, name ASC
    ";
    
    try {
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $kunden = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($kunden);
        exit();
    } catch (PDOException $e) {
        sendError(500, 'Query failed: ' . $e->getMessage());
    }
}

// ============ GET KUNDE BY ID ============
function getKundenById($conn, $id) {
    try {
        $stmt = $conn->prepare("SELECT * FROM kunde WHERE kunden_id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$result) {
            sendError(404, 'Kunde not found');
        }
        
        http_response_code(200);
        echo json_encode($result);
        exit();
    } catch (PDOException $e) {
        sendError(500, 'Execute failed: ' . $e->getMessage());
    }
}

// ============ CREATE KUNDE ============
function createKunden($conn) {
    $data = getJsonInput();
    
    // Validation
    if (!isset($data['Name']) || !isset($data['Firma'])) {
        sendError(400, 'Missing required fields: Name, Firma');
    }
    
    try {
        $stmt = $conn->prepare("
            INSERT INTO kunde (vorname, name, firma, addresse, plz, ort, telefonnummer)
            VALUES (:vorname, :name, :firma, :addresse, :plz, :ort, :telefonnummer)
            RETURNING kunden_id
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
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $insertId = $result['kunden_id'];
        sendCreated($insertId, 'Kunde created successfully');
    } catch (PDOException $e) {
        sendError(500, 'Create failed: ' . $e->getMessage());
    }
}

// ============ UPDATE KUNDE ============
function updateKunden($conn) {
    $data = getJsonInput();
    
    if (!isset($data['Kunden_id'])) {
        sendError(400, 'Missing Kunden_id');
    }
    
    try {
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
        
        $query = "UPDATE kunde SET " . implode(", ", $fields) . " WHERE kunden_id = :id";
        $stmt = $conn->prepare($query);
        $bindings[':id'] = (int)$data['Kunden_id'];
        
        if (!$stmt->execute($bindings)) {
            sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
        }
        
        if ($stmt->rowCount() === 0) {
            sendError(404, 'Kunde not found');
        }
        
        sendSuccess([], 'Kunde updated successfully');
    } catch (PDOException $e) {
        sendError(500, 'Update failed: ' . $e->getMessage());
    }
}

// ============ DELETE KUNDE ============
function deleteKunden($conn) {
    $data = getJsonInput();
    
    if (!isset($data['Kunden_id'])) {
        sendError(400, 'Missing Kunden_id');
    }
    
    try {
        $stmt = $conn->prepare("DELETE FROM kunde WHERE kunden_id = :id");
        $stmt->bindParam(':id', $data['Kunden_id'], PDO::PARAM_INT);
        
        if (!$stmt->execute()) {
            sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
        }
        
        if ($stmt->rowCount() === 0) {
            sendError(404, 'Kunde not found');
        }
        
        sendSuccess([], 'Kunde deleted successfully');
    } catch (PDOException $e) {
        sendError(500, 'Delete failed: ' . $e->getMessage());
    }
}
?>