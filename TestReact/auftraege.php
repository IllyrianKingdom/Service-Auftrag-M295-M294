<?php
// ============ CORS HEADERS (MUST BE FIRST!) ============
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');


// ============ PREFLIGHT REQUEST ============
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}


// ============ ERROR REPORTING (DEVELOPMENT) ============
error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('log_errors', '1');


// ============ DEPENDENCIES ============
require_once 'config.php';


// ============ HELPER FUNCTIONS (FEHLEND!) ============

/**
 * Liest JSON aus Request Body
 */
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

/**
 * Sendet Error Response
 */
function sendError($code, $message) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message
    ]);
    exit();
}

/**
 * Sendet Success Response
 */
function sendSuccess($data = [], $message = 'Success') {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

/**
 * Sendet Created Response (201)
 */
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
    
    // Router basierend auf HTTP Method
    if ($method === 'GET') {
        getAllAuftraege($conn);
    } elseif ($method === 'POST') {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY);
        
        if (strpos($path, 'delete') !== false) {
            deleteAuftrag($conn);
        } elseif (strpos($path, 'update') !== false) {
            updateAuftrag($conn);
        } else {
            createAuftrag($conn);
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


// ============ GET ALL AUFTRAEGE ============
function getAllAuftraege($pdo) {
    $query = "
        SELECT 
            a.auftrag_id,
            a.auftragsname,
            a.angefangen_am,
            a.erledigt_am,
            a.status,
            a.erfasst_am,
            a.erfasst_von,
            a.kunden_id,
            k.vorname,
            k.name,
            k.firma,
            k.addresse,
            k.plz,
            k.ort,
            k.telefonnummer
        FROM auftraege a
        LEFT JOIN kunde k ON a.kunden_id = k.kunden_id
        ORDER BY a.angefangen_am DESC
    ";

    try {
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $auftraege = $stmt->fetchAll(PDO::FETCH_ASSOC);  // ← PDO-Magie!
        
        echo json_encode($auftraege);  // ← Dein Array für React
        exit();
    } catch (PDOException $e) {
        sendError(500, 'Query failed: ' . $e->getMessage());
    }
}

// ============ CREATE AUFTRAG ============
function createAuftrag($conn) {
    $data = getJsonInput();

    // Validation
    if (empty($data['Auftragsname']) || empty($data['Kunden_id'])) {
        sendError(400, 'Missing required fields: Auftragsname, Kunden_id');
    }

    $auftragsname = trim($data['Auftragsname']);
    $kunden_id = (int)$data['Kunden_id'];
    $status = $data['Status'] ?? 'erfasst';
    $angefangen_am = $data['Angefangen_am'] ?? date('Y-m-d');
    $erfasst_von = (int)($data['Erfasst_von'] ?? 1);

    $stmt = $conn->prepare("
        INSERT INTO auftraege 
        (auftragsname, kunden_id, status, angefangen_am, erfasst_von, erfasst_am)
        VALUES (?, ?, ?, ?, ?, NOW())
    ");

    if (!$stmt) {
        sendError(500, 'Prepare failed: ' . $conn->error);
    }

    // WICHTIG: Richtige Reihenfolge! s=string, i=integer
    // auftragsname(s), kunden_id(i), status(s), angefangen_am(s), erfasst_von(i)
    if (!$stmt->bind_param("sissi", $auftragsname, $kunden_id, $status, $angefangen_am, $erfasst_von)) {
        sendError(500, 'Bind failed: ' . $stmt->error);
    }

    if (!$stmt->execute()) {
        sendError(500, 'Execute failed: ' . $stmt->error);
    }

    $insertId = $stmt->insert_id;
    $stmt->close();
    
    sendCreated($insertId, 'Auftrag created successfully');
}


// ============ UPDATE AUFTRAG ============
function updateAuftrag($conn) {
    $data = getJsonInput();

    if (empty($data['Auftrag_id']) || empty($data['Status'])) {
        sendError(400, 'Missing required fields: Auftrag_id, Status');
    }

    $auftrag_id = (int)$data['Auftrag_id'];
    $status = trim($data['Status']);
    $erledigt_am = !empty($data['Erledigt_am']) ? $data['Erledigt_am'] : null;

    $stmt = $conn->prepare("
        UPDATE auftraege
        SET status = ?, erledigt_am = ?
        WHERE auftrag_id = ?
    ");

    if (!$stmt) {
        sendError(500, 'Prepare failed: ' . $conn->error);
    }

    if (!$stmt->bind_param("ssi", $status, $erledigt_am, $auftrag_id)) {
        sendError(500, 'Bind failed: ' . $stmt->error);
    }

    if (!$stmt->execute()) {
        sendError(500, 'Execute failed: ' . $stmt->error);
    }

    if ($stmt->affected_rows === 0) {
        $stmt->close();
        sendError(404, 'Auftrag not found');
    }

    $stmt->close();
    sendSuccess([], 'Auftrag updated successfully');
}


// ============ DELETE AUFTRAG ============
function deleteAuftrag($conn) {
    $data = getJsonInput();

    if (empty($data['Auftrag_id'])) {
        sendError(400, 'Missing Auftrag_id');
    }

    $auftrag_id = (int)$data['Auftrag_id'];

    $stmt = $conn->prepare("DELETE FROM auftraege WHERE auftrag_id = ?");

    if (!$stmt) {
        sendError(500, 'Prepare failed: ' . $conn->error);
    }

    if (!$stmt->bind_param("i", $auftrag_id)) {
        sendError(500, 'Bind failed: ' . $stmt->error);
    }

    if (!$stmt->execute()) {
        sendError(500, 'Execute failed: ' . $stmt->error);
    }

    if ($stmt->affected_rows === 0) {
        $stmt->close();
        sendError(404, 'Auftrag not found');
    }

    $stmt->close();
    sendSuccess([], 'Auftrag deleted successfully');
}

?>