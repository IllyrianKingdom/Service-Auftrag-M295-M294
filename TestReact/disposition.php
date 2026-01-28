<?php
// ============ CORS HEADERS (MUST BE FIRST!) ============
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');


// ============ PREFLIGHT REQUEST ============
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}


// ============ DEPENDENCIES ============
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


// ============ MAIN ROUTER (FIXED!) ============
try {
    $conn = getDBConnection();
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        getAllDisposition($conn);
    } elseif ($method === 'POST') {
        // Use $_SERVER['QUERY_STRING']
        $query = $_SERVER['QUERY_STRING'] ?? '';
        
        if (strpos($query, 'delete') !== false) {
            deleteDisposition($conn);
        } elseif (strpos($query, 'update') !== false) {
            updateDisposition($conn);
        } else {
            createDisposition($conn);
        }
    } else {
        sendError(405, 'Method not allowed');
    }
} catch (Exception $e) {
    sendError(500, 'Server error: ' . $e->getMessage());
} finally {
    $conn = null;
}


// ============ GET ALL DISPOSITIONEN ============
function getAllDisposition($conn) {
    $query = "
        SELECT
            d.disposition_id,
            d.disponent_id,
            d.mitarbeiter_id,
            d.auftrag_id,
            d.geplanter_termin,
            d.status,
            d.notiz,
            m.name as mitarbeiter_name,
            a.auftragsname
        FROM Disposition d
        LEFT JOIN Mitarbeiter m ON d.mitarbeiter_id = m.mitarbeiter_id
        LEFT JOIN Auftraege a ON d.auftrag_id = a.auftrag_id
        WHERE 1=1
    ";

    // Optional: Filter by Mitarbeiter
    if (isset($_GET['mitarbeiter_id'])) {
        $mitarbeiter_id = (int)$_GET['mitarbeiter_id'];
        $query .= " AND d.mitarbeiter_id = " . $mitarbeiter_id;
    }

    // Optional: Filter by Datum
    if (isset($_GET['datum'])) {
        $datum = $_GET['datum'];
        $query .= " AND DATE(d.geplanter_termin) = '" . $datum . "'";
    }

    $query .= " ORDER BY d.geplanter_termin ASC";

    try {
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $dispositionen = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($dispositionen);
        exit();
    } catch (PDOException $e) {
        sendError(500, 'Database query failed: ' . $e->getMessage());
    }
}


// ============ CREATE DISPOSITION ============
function createDisposition($conn) {
    $data = getJsonInput();

    // Beide Felder sind NOT NULL!
    if (!isset($data['Disponent_id']) || !isset($data['Mitarbeiter_id']) || !isset($data['Auftrag_id'])) {
        sendError(400, 'Missing required fields: Disponent_id, Mitarbeiter_id, Auftrag_id');
    }

    $disponent_id = (int)$data['Disponent_id'];
    $mitarbeiter_id = (int)$data['Mitarbeiter_id'];
    $auftrag_id = (int)$data['Auftrag_id'];
    $geplanter_termin = $data['Geplanter_Termin'] ?? date('Y-m-d H:i:s');
    $status = $data['Status'] ?? 'geplant';
    $notiz = $data['Notiz'] ?? '';

    $sql = "
        INSERT INTO Disposition (disponent_id, mitarbeiter_id, auftrag_id, geplanter_termin, status, notiz)
        VALUES (:disponent_id, :mitarbeiter_id, :auftrag_id, :geplanter_termin, :status, :notiz)
    ";

    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':disponent_id' => $disponent_id,
            ':mitarbeiter_id' => $mitarbeiter_id,
            ':auftrag_id' => $auftrag_id,
            ':geplanter_termin' => $geplanter_termin,
            ':status' => $status,
            ':notiz' => $notiz
        ]);
        
        $insertId = $conn->lastInsertId('Disposition_disposition_id_seq');
        sendCreated($insertId, 'Disposition created successfully');
    } catch (PDOException $e) {
        sendError(500, 'Insert failed: ' . $e->getMessage());
    }
}


// ============ UPDATE DISPOSITION ============
function updateDisposition($conn) {
    $data = getJsonInput();

    if (!isset($data['Disposition_id'])) {
        sendError(400, 'Missing Disposition_id');
    }

    $disposition_id = (int)$data['Disposition_id'];
    $updates = [];
    $bindings = [':id' => $disposition_id];

    // Allowed fields to update
    $allowed = ['Status', 'Geplanter_Termin', 'Notiz'];
    foreach ($allowed as $field) {
        if (isset($data[$field])) {
            $updates[] = strtolower($field) . ' = :' . strtolower($field);
            $bindings[':' . strtolower($field)] = $data[$field];
        }
    }

    if (empty($updates)) {
        sendError(400, 'No fields to update');
    }

    $sql = "UPDATE Disposition SET " . implode(', ', $updates) . " WHERE disposition_id = :id";

    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute($bindings);
        
        if ($stmt->rowCount() === 0) {
            sendError(404, 'Disposition not found');
        }
        
        sendSuccess([], 'Disposition updated successfully');
    } catch (PDOException $e) {
        sendError(500, 'Update failed: ' . $e->getMessage());
    }
}


// ============ DELETE DISPOSITION ============
function deleteDisposition($conn) {
    $data = getJsonInput();

    if (!isset($data['Disposition_id'])) {
        sendError(400, 'Missing Disposition_id');
    }

    $disposition_id = (int)$data['Disposition_id'];
    $sql = "DELETE FROM Disposition WHERE disposition_id = :id";

    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute([':id' => $disposition_id]);
        
        if ($stmt->rowCount() === 0) {
            sendError(404, 'Disposition not found');
        }
        
        sendSuccess([], 'Disposition deleted successfully');
    } catch (PDOException $e) {
        sendError(500, 'Delete failed: ' . $e->getMessage());
    }
}

?>
