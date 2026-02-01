<?php
session_start();
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


// ============ GET CURRENT USER ID ============
function getCurrentUserId() {
    // Wenn du ein Session-System hast, nutze das
    // Beispiel (du musst das an dein Auth-System anpassen):
    if (isset($_SESSION['mitarbeiter_id'])) {
        return (int)$_SESSION['mitarbeiter_id'];
    }
    // Fallback (sollte später entfernt werden!)
    return 1;
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


// ============ GET ALL AUFTRAEGE (MIT KUNDE JOIN) ============
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
            k.firma,
            k.vorname,
            k.name
        FROM auftraege a
        LEFT JOIN Kunde k ON a.kunden_id = k.kunden_id
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
        $erfasst_von = getCurrentUserId();  // ← Aus Session statt hardcodiert
        
        // Validiere Status Enum
        $validStatuses = ['erfasst', 'disponiert', 'ausgeführt', 'freigegeben', 'verrechnet'];
        if (!in_array($status, $validStatuses)) {
            sendError(400, 'Invalid status value');
        }
        
        // Validiere Kunde existiert
        $kundeCheck = $conn->prepare("SELECT kunden_id FROM Kunde WHERE kunden_id = :kunden_id");
        $kundeCheck->bindParam(':kunden_id', $kunden_id, PDO::PARAM_INT);
        $kundeCheck->execute();
        if ($kundeCheck->rowCount() === 0) {
            sendError(404, 'Kunde not found');
        }
        
        // Validiere Mitarbeiter existiert
        $mitarbeiterCheck = $conn->prepare("SELECT mitarbeiter_id FROM Mitarbeiter WHERE mitarbeiter_id = :mitarbeiter_id");
        $mitarbeiterCheck->bindParam(':mitarbeiter_id', $erfasst_von, PDO::PARAM_INT);
        $mitarbeiterCheck->execute();
        if ($mitarbeiterCheck->rowCount() === 0) {
            sendError(404, 'Mitarbeiter not found');
        }
        
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
        
        // Validiere Status Enum
        $validStatuses = ['erfasst', 'disponiert', 'ausgeführt', 'freigegeben', 'verrechnet'];
        if (!in_array($status, $validStatuses)) {
            sendError(400, 'Invalid status value');
        }
        
        // Validiere Auftrag existiert
        $auftragCheck = $conn->prepare("SELECT auftrag_id FROM Auftraege WHERE auftrag_id = :auftrag_id");
        $auftragCheck->bindParam(':auftrag_id', $auftrag_id, PDO::PARAM_INT);
        $auftragCheck->execute();
        if ($auftragCheck->rowCount() === 0) {
            sendError(404, 'Auftrag not found');
        }
        
        $stmt = $conn->prepare("
            UPDATE auftraege
            SET status = :status, erledigt_am = :erledigt_am, updated_at = NOW()
            WHERE auftrag_id = :auftrag_id
        ");
        
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':erledigt_am', $erledigt_am);
        $stmt->bindParam(':auftrag_id', $auftrag_id, PDO::PARAM_INT);
        
        if (!$stmt->execute()) {
            sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
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
        
        // Validiere Auftrag existiert
        $auftragCheck = $conn->prepare("SELECT auftrag_id FROM Auftraege WHERE auftrag_id = :auftrag_id");
        $auftragCheck->bindParam(':auftrag_id', $auftrag_id, PDO::PARAM_INT);
        $auftragCheck->execute();
        if ($auftragCheck->rowCount() === 0) {
            sendError(404, 'Auftrag not found');
        }
        
        $stmt = $conn->prepare("DELETE FROM auftraege WHERE auftrag_id = :auftrag_id");
        $stmt->bindParam(':auftrag_id', $auftrag_id, PDO::PARAM_INT);
        
        if (!$stmt->execute()) {
            sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
        }
        
        sendSuccess([], 'Auftrag deleted successfully');
    } catch (PDOException $e) {
        sendError(500, 'Delete failed: ' . $e->getMessage());
    }
}
?>
