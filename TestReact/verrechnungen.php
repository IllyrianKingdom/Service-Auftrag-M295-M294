<?php
require_once 'config.php';

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        getAllVerrechnungen($conn);
    } elseif ($method === 'POST') {
        if (strpos($_SERVER['REQUEST_URI'], 'update') !== false) {
            updateVerrechnung($conn);
        } elseif (strpos($_SERVER['REQUEST_URI'], 'delete') !== false) {
            deleteVerrechnung($conn);
        } else {
            createVerrechnung($conn);
        }
    } else {
        sendError(405, 'Method not allowed');
    }
} catch (Exception $e) {
    sendError(500, $e->getMessage());
} finally {
    $conn = null;
}

function getAllVerrechnungen($conn) {
    $query = "
        SELECT
        v.verrechnungen_id,
        v.auftrag_id,
        v.rechnungsdatum,
        v.betrag,
        v.status,
        v.bemerkung,
        a.auftragsname,
        k.firma,
        k.name,
        k.vorname
        FROM Verrechnungen v
        LEFT JOIN Auftraege a ON v.auftrag_id = a.auftrag_id
        LEFT JOIN Kunde k ON a.kunden_id = k.kunden_id
        WHERE 1=1
    ";

    // Optional: Filter by Status
    if (isset($_GET['status'])) {
        $status = $_GET['status'];
        $query .= " AND v.status = '" . $status . "'";
    }

    $query .= " ORDER BY v.rechnungsdatum DESC";

    $stmt = $conn->prepare($query);
    if (!$stmt->execute()) {
        sendError(500, 'Database query failed');
    }

    $verrechnungen = $stmt->fetchAll();
    http_response_code(200);
    echo json_encode($verrechnungen);
}

function createVerrechnung($conn) {
    $data = getJsonInput();

    if (!isset($data['Auftrag_id']) || !isset($data['Betrag'])) {
        sendError(400, 'Missing required fields: Auftrag_id, Betrag');
    }

    $stmt = $conn->prepare("
        INSERT INTO Verrechnungen (auftrag_id, rechnungsdatum, betrag, status, bemerkung)
        VALUES (:auftrag_id, :rechnungsdatum, :betrag, :status, :bemerkung)
    ");

    $auftrag_id = (int)$data['Auftrag_id'];
    $rechnungsdatum = $data['Rechnungsdatum'] ?? date('Y-m-d');
    $betrag = (float)$data['Betrag'];
    $status = $data['Status'] ?? 'offen';
    $bemerkung = $data['Bemerkung'] ?? '';

    $stmt->bindParam(':auftrag_id', $auftrag_id, PDO::PARAM_INT);
    $stmt->bindParam(':rechnungsdatum', $rechnungsdatum);
    $stmt->bindParam(':betrag', $betrag);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':bemerkung', $bemerkung);

    if (!$stmt->execute()) {
        sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
    }

    $insertId = $conn->lastInsertId('Verrechnungen_verrechnungen_id_seq');
    sendCreated($insertId, 'Verrechnung created successfully');
}

function updateVerrechnung($conn) {
    $data = getJsonInput();

    if (!isset($data['Verrechnungen_id'])) {
        sendError(400, 'Missing Verrechnungen_id');
    }

    $fields = [];
    $bindings = [];
    $allowed = ['Status', 'Betrag', 'Bemerkung'];

    foreach ($allowed as $field) {
        if (isset($data[$field])) {
            $fields[] = strtolower($field) . " = :" . strtolower($field);
            $bindings[':' . strtolower($field)] = $data[$field];
        }
    }

    if (empty($fields)) {
        sendError(400, 'No fields to update');
    }

    $query = "UPDATE Verrechnungen SET " . implode(", ", $fields) . " WHERE verrechnungen_id = :id";
    $stmt = $conn->prepare($query);

    $bindings[':id'] = (int)$data['Verrechnungen_id'];

    if (!$stmt->execute($bindings)) {
        sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
    }

    if ($stmt->rowCount() === 0) {
        sendError(404, 'Verrechnung not found');
    }

    sendSuccess([], 'Verrechnung updated successfully');
}

function deleteVerrechnung($conn) {
    $data = getJsonInput();

    if (!isset($data['Verrechnungen_id'])) {
        sendError(400, 'Missing Verrechnungen_id');
    }

    $stmt = $conn->prepare("DELETE FROM Verrechnungen WHERE verrechnungen_id = :id");
    $stmt->bindParam(':id', $data['Verrechnungen_id'], PDO::PARAM_INT);

    if (!$stmt->execute()) {
        sendError(500, 'Execute failed: ' . implode(', ', $stmt->errorInfo()));
    }

    if ($stmt->rowCount() === 0) {
        sendError(404, 'Verrechnung not found');
    }

    sendSuccess([], 'Verrechnung deleted successfully');
}

?>