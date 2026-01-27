<?php
require_once 'config.php';

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        getAllDisposition($conn);
    } elseif ($method === 'POST') {
        if (strpos($_SERVER['REQUEST_URI'], 'update') !== false) {
            updateDisposition($conn);
        } elseif (strpos($_SERVER['REQUEST_URI'], 'delete') !== false) {
            deleteDisposition($conn);
        } else {
            createDisposition($conn);
        }
    } else {
        sendError(405, 'Method not allowed');
    }
} catch (Exception $e) {
    sendError(500, $e->getMessage());
} finally {
    $conn = null;
}

function getAllDisposition($conn) {
    $query = "
        SELECT
        d.disposition_id,
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

    $stmt = $conn->prepare($query);
    if (!$stmt->execute()) {
        sendError(500, 'Database query failed');
    }

    $dispositionen = $stmt->fetchAll();
    http_response_code(200);
    echo json_encode($dispositionen);
}

function createDisposition($conn) {
    $data = getJsonInput();

    if (!isset($data['Mitarbeiter_id']) || !isset($data['Auftrag_id'])) {
        sendError(400, 'Missing required fields: Mitarbeiter_id, Auftrag_id');
    }

    $stmt = $conn->prepare("
        INSERT INTO Disposition (mitarbeiter_id, auftrag_id, geplanter_termin, status, notiz)
        VALUES (:mitarbeiter_id, :auftrag_id, :geplanter_termin, :status, :notiz)
    ");

    $mitarbeiter_id = (int)$data['Mitarbeiter_id'];
    $auftrag_id = (int)$data['Auftrag_id'];
    $geplanter_termin = $data['Geplanter_Termin'];
    $status = $data['Status'] ?? 'geplant';
    $notiz = $data['Notiz'] ?? '';

    $stmt->bindParam(':mitarbeiter_id', $mitarbeiter_id, PDO::PARAM_INT);
    $stmt->bindParam(':auftrag_id', $auftrag_id, PDO::PARAM_INT);
    $stmt->bindParam(':geplanter_termin', $geplanter_termin);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':notiz', $notiz);

    if (!$stmt->execute()) {
        sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
    }

    $insertId = $conn->lastInsertId('Disposition_disposition_id_seq');
    sendCreated($insertId, 'Disposition created successfully');
}

function updateDisposition($conn) {
    $data = getJsonInput();

    if (!isset($data['Disposition_id'])) {
        sendError(400, 'Missing Disposition_id');
    }

    $fields = [];
    $bindings = [];
    $allowed = ['Status', 'Geplanter_Termin', 'Notiz'];

    foreach ($allowed as $field) {
        if (isset($data[$field])) {
            $fields[] = strtolower($field) . " = :" . strtolower($field);
            $bindings[':' . strtolower($field)] = $data[$field];
        }
    }

    if (empty($fields)) {
        sendError(400, 'No fields to update');
    }

    $query = "UPDATE Disposition SET " . implode(", ", $fields) . " WHERE disposition_id = :id";
    $stmt = $conn->prepare($query);

    $bindings[':id'] = (int)$data['Disposition_id'];

    if (!$stmt->execute($bindings)) {
        sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
    }

    if ($stmt->rowCount() === 0) {
        sendError(404, 'Disposition not found');
    }

    sendSuccess([], 'Disposition updated successfully');
}

function deleteDisposition($conn) {
    $data = getJsonInput();

    if (!isset($data['Disposition_id'])) {
        sendError(400, 'Missing Disposition_id');
    }

    $stmt = $conn->prepare("DELETE FROM Disposition WHERE disposition_id = :id");
    $stmt->bindParam(':id', $data['Disposition_id'], PDO::PARAM_INT);

    if (!$stmt->execute()) {
        sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
    }

    if ($stmt->rowCount() === 0) {
        sendError(404, 'Disposition not found');
    }

    sendSuccess([], 'Disposition deleted successfully');
}

?>