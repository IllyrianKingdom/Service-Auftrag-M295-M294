<?php
require_once 'config.php';

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        getAllAuftraege($conn);
    } elseif ($method === 'POST') {
        if (strpos($_SERVER['REQUEST_URI'], 'update') !== false) {
            updateAuftrag($conn);
        } elseif (strpos($_SERVER['REQUEST_URI'], 'delete') !== false) {
            deleteAuftrag($conn);
        } else {
            createAuftrag($conn);
        }
    } else {
        sendError(405, 'Method not allowed');
    }
} catch (Exception $e) {
    sendError(500, $e->getMessage());
} finally {
    $conn = null;
}

function getAllAuftraege($conn) {
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
        FROM Auftraege a
        LEFT JOIN Kunde k ON a.kunden_id = k.kunden_id
        ORDER BY a.angefangen_am DESC
    ";

    $stmt = $conn->prepare($query);
    if (!$stmt->execute()) {
        sendError(500, 'Database query failed');
    }

    $auftraege = $stmt->fetchAll();
    http_response_code(200);
    echo json_encode($auftraege);
}

function createAuftrag($conn) {
    $data = getJsonInput();

    if (!isset($data['Auftragsname']) || !isset($data['Kunden_id'])) {
        sendError(400, 'Missing required fields: Auftragsname, Kunden_id');
    }

    $stmt = $conn->prepare("
        INSERT INTO Auftraege (auftragsname, kunden_id, status, angefangen_am, erfasst_von, erfasst_am)
        VALUES (:auftragsname, :kunden_id, :status, :angefangen_am, :erfasst_von, NOW())
    ");

    $auftragsname = $data['Auftragsname'];
    $kunden_id = (int)$data['Kunden_id'];
    $status = $data['Status'] ?? 'erfasst';
    $angefangen_am = $data['Angefangen_am'] ?? date('Y-m-d');
    $erfasst_von = (int)($data['Erfasst_von'] ?? 1);

    $stmt->bindParam(':auftragsname', $auftragsname);
    $stmt->bindParam(':kunden_id', $kunden_id, PDO::PARAM_INT);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':angefangen_am', $angefangen_am);
    $stmt->bindParam(':erfasst_von', $erfasst_von, PDO::PARAM_INT);

    if (!$stmt->execute()) {
        sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
    }

    $insertId = $conn->lastInsertId('Auftraege_auftrag_id_seq');
    sendCreated($insertId, 'Auftrag created successfully');
}

function updateAuftrag($conn) {
    $data = getJsonInput();

    if (!isset($data['Auftrag_id']) || !isset($data['Status'])) {
        sendError(400, 'Missing required fields: Auftrag_id, Status');
    }

    $erledigt_am = $data['Erledigt_am'] ?? null;

    $stmt = $conn->prepare("
        UPDATE Auftraege
        SET status = :status, erledigt_am = :erledigt_am
        WHERE auftrag_id = :id
    ");

    $status = $data['Status'];
    $auftrag_id = (int)$data['Auftrag_id'];

    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':erledigt_am', $erledigt_am);
    $stmt->bindParam(':id', $auftrag_id, PDO::PARAM_INT);

    if (!$stmt->execute()) {
        sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
    }

    if ($stmt->rowCount() === 0) {
        sendError(404, 'Auftrag not found');
    }

    sendSuccess([], 'Auftrag updated successfully');
}

function deleteAuftrag($conn) {
    $data = getJsonInput();

    if (!isset($data['Auftrag_id'])) {
        sendError(400, 'Missing Auftrag_id');
    }

    $stmt = $conn->prepare("DELETE FROM Auftraege WHERE auftrag_id = :id");
    $stmt->bindParam(':id', $data['Auftrag_id'], PDO::PARAM_INT);

    if (!$stmt->execute()) {
        sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
    }

    if ($stmt->rowCount() === 0) {
        sendError(404, 'Auftrag not found');
    }

    sendSuccess([], 'Auftrag deleted successfully');
}

?>