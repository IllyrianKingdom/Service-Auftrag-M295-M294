<?php
// ============ ERROR HANDLING ============
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/var/log/php_errors.log');

// ============ CORS HEADERS (WICHTIG!) ============
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// ============ PREFLIGHT HANDLING ============
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ============ DATABASE CONNECTION (PostgreSQL) ============
function getDBConnection() {
    try {
        $dsn = 'pgsql:host=aws-1-eu-central-1.pooler.supabase.com' . 
               ';port=5432' . 
               ';dbname=postgres' . 
               ';sslmode=require';
        
        $pdo = new PDO($dsn, 'postgres.kemkyxpxvpxikuusrubo', 'VedranAlessioArnis', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_PERSISTENT => false
        ]);
        return $pdo;
    } catch (PDOException $e) {
        sendError(500, 'Database connection failed: ' . $e->getMessage());
    }
}

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
        $auftraege = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($auftraege);
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
    
    try {
        $auftragsname = trim($data['Auftragsname']);
        $kunden_id = (int)$data['Kunden_id'];
        $status = $data['Status'] ?? 'erfasst';
        $angefangen_am = $data['Angefangen_am'] ?? date('Y-m-d');
        $erfasst_von = (int)($data['Erfasst_von'] ?? 1);
        
        $stmt = $conn->prepare("
            INSERT INTO auftraege
            (auftragsname, kunden_id, status, angefangen_am, erfasst_von, erfasst_am)
            VALUES (:auftragsname, :kunden_id, :status, :angefangen_am, :erfasst_von, NOW())
            RETURNING auftrag_id
        ");
        
        $stmt->bindParam(':auftragsname', $auftragsname);
        $stmt->bindParam(':kunden_id', $kunden_id, PDO::PARAM_INT);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':angefangen_am', $angefangen_am);
        $stmt->bindParam(':erfasst_von', $erfasst_von, PDO::PARAM_INT);
        
        if (!$stmt->execute()) {
            sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
        }
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $insertId = $result['auftrag_id'];
        sendCreated($insertId, 'Auftrag created successfully');
    } catch (PDOException $e) {
        sendError(500, 'Create failed: ' . $e->getMessage());
    }
}

// ============ UPDATE AUFTRAG ============
function updateAuftrag($conn) {
    $data = getJsonInput();
    
    if (empty($data['Auftrag_id']) || empty($data['Status'])) {
        sendError(400, 'Missing required fields: Auftrag_id, Status');
    }
    
    try {
        $auftrag_id = (int)$data['Auftrag_id'];
        $status = trim($data['Status']);
        $erledigt_am = !empty($data['Erledigt_am']) ? $data['Erledigt_am'] : null;
        
        $stmt = $conn->prepare("
            UPDATE auftraege
            SET status = :status, erledigt_am = :erledigt_am
            WHERE auftrag_id = :auftrag_id
        ");
        
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':erledigt_am', $erledigt_am);
        $stmt->bindParam(':auftrag_id', $auftrag_id, PDO::PARAM_INT);
        
        if (!$stmt->execute()) {
            sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
        }
        
        if ($stmt->rowCount() === 0) {
            sendError(404, 'Auftrag not found');
        }
        
        sendSuccess([], 'Auftrag updated successfully');
    } catch (PDOException $e) {
        sendError(500, 'Update failed: ' . $e->getMessage());
    }
}

// ============ DELETE AUFTRAG ============
function deleteAuftrag($conn) {
    $data = getJsonInput();
    
    if (empty($data['Auftrag_id'])) {
        sendError(400, 'Missing Auftrag_id');
    }
    
    try {
        $auftrag_id = (int)$data['Auftrag_id'];
        $stmt = $conn->prepare("DELETE FROM auftraege WHERE auftrag_id = :auftrag_id");
        $stmt->bindParam(':auftrag_id', $auftrag_id, PDO::PARAM_INT);
        
        if (!$stmt->execute()) {
            sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
        }
        
        if ($stmt->rowCount() === 0) {
            sendError(404, 'Auftrag not found');
        }
        
        sendSuccess([], 'Auftrag deleted successfully');
    } catch (PDOException $e) {
        sendError(500, 'Delete failed: ' . $e->getMessage());
    }
}
?>