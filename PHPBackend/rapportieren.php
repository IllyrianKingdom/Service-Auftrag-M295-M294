<?php
header('Content-Type: application/json');
require_once 'config.php';

// ============ ERROR HANDLING ============
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

function sendCreated($data, $message = 'Created') {
  http_response_code(201);
  echo json_encode([
    'success' => true,
    'message' => $message,
    'data' => $data
  ]);
  exit();
}

// ============ MAIN ROUTER ============
try {
  $conn = getDBConnection();
  $method = $_SERVER['REQUEST_METHOD'];
  $report_id = $_GET['report_id'] ?? null;

  if ($method === 'GET') {
    if ($report_id) {
      getBerichtDetail($conn, $report_id);
    } else {
      getAllBerichte($conn);
    }
  } elseif ($method === 'POST') {
    createBericht($conn);
  } elseif ($method === 'PUT') {
    if (!$report_id) {
      sendError(400, 'report_id erforderlich');
    }
    updateBericht($conn, $report_id);
  } elseif ($method === 'DELETE') {
    if (!$report_id) {
      sendError(400, 'report_id erforderlich');
    }
    deleteBericht($conn, $report_id);
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

// ============ GET ALL BERICHTE ============
function getAllBerichte($conn) {
  try {
    $zeitraum_von = $_GET['zeitraum_von'] ?? null;
    $zeitraum_bis = $_GET['zeitraum_bis'] ?? null;
    $mitarbeiter_id = $_GET['mitarbeiter_id'] ?? null;
    $auftrag_id = $_GET['auftrag_id'] ?? null;
    $freigegeben = $_GET['freigegeben'] ?? null;
    $search = $_GET['search'] ?? null;

    $sql = "
      SELECT
        r.report_id,
        r.mitarbeiter_id,
        r.freigegeben_von,
        r.auftrag_id,
        r.arbeitsdatum,
        r.arbeitszeit,
        r.bemerkung,
        r.freigegeben,
        r.created_at,
        r.updated_at,
        a.auftragsname,
        a.status as auftrag_status,
        k.kunden_id,
        k.vorname as kunde_vorname,
        k.name as kunde_name,
        k.firma,
        k.addresse,
        k.plz,
        k.ort,
        k.telefonnummer,
        m.vorname,
        m.name,
        m.rolle
      FROM Rapportieren r
      JOIN Auftraege a ON r.auftrag_id = a.auftrag_id
      JOIN Kunde k ON a.kunden_id = k.kunden_id
      JOIN Mitarbeiter m ON r.mitarbeiter_id = m.mitarbeiter_id
      WHERE 1=1
    ";

    $params = [];
    if ($zeitraum_von) {
      $sql .= " AND r.arbeitsdatum >= :zeitraum_von";
      $params[':zeitraum_von'] = $zeitraum_von;
    }
    if ($zeitraum_bis) {
      $sql .= " AND r.arbeitsdatum <= :zeitraum_bis";
      $params[':zeitraum_bis'] = $zeitraum_bis;
    }
    if ($mitarbeiter_id) {
      $sql .= " AND r.mitarbeiter_id = :mitarbeiter_id";
      $params[':mitarbeiter_id'] = (int)$mitarbeiter_id;
    }
    if ($auftrag_id) {
      $sql .= " AND r.auftrag_id = :auftrag_id";
      $params[':auftrag_id'] = (int)$auftrag_id;
    }
    if ($freigegeben !== null) {
      $freigegeben_bool = strtolower($freigegeben) === 'true' ? true : false;
      $sql .= " AND r.freigegeben = :freigegeben";
      $params[':freigegeben'] = $freigegeben_bool;
    }
    if ($search) {
      $sql .= " AND (
        a.auftragsname ILIKE :search
        OR k.firma ILIKE :search
        OR k.name ILIKE :search
        OR r.bemerkung ILIKE :search
      )";
      $params[':search'] = "%{$search}%";
    }

    $sql .= " ORDER BY r.arbeitsdatum DESC, r.created_at DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $berichte = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ⭐ VERRECHNUNGEN FÜR JEDEN BERICHT LADEN
    $berichte = array_map(function($b) use ($conn) {
      $b = transformBerichtToFrontend($b);
      
      // Verrechnungen für diesen Auftrag laden
      $verrStmt = $conn->prepare("
        SELECT 
          verrechnung_id, 
          auftrag_id, 
          betrag, 
          status, 
          rechnungsdatum, 
          bemerkung,
          created_at
        FROM verrechnungen 
        WHERE auftrag_id = :auftrag_id
      ");
      $verrStmt->execute([':auftrag_id' => $b['auftrag_id']]);
      $b['verrechnungen'] = $verrStmt->fetchAll(PDO::FETCH_ASSOC);
      
      return $b;
    }, $berichte);

    echo json_encode($berichte);
    exit();

  } catch (PDOException $e) {
    sendError(500, 'Query failed: ' . $e->getMessage());
  }
}

function getBerichtDetail($conn, $report_id) {
  try {
    $sql = "
      SELECT
        r.report_id,
        r.mitarbeiter_id,
        r.freigegeben_von,
        r.auftrag_id,
        r.arbeitsdatum,
        r.arbeitszeit,
        r.bemerkung,
        r.freigegeben,
        r.created_at,
        r.updated_at,
        a.auftragsname,
        a.status as auftrag_status,
        k.kunden_id,
        k.vorname as kunde_vorname,
        k.name as kunde_name,
        k.firma,
        k.addresse,
        k.plz,
        k.ort,
        k.telefonnummer,
        m.vorname,
        m.name,
        m.rolle
      FROM Rapportieren r
      JOIN Auftraege a ON r.auftrag_id = a.auftrag_id
      JOIN Kunde k ON a.kunden_id = k.kunden_id
      JOIN Mitarbeiter m ON r.mitarbeiter_id = m.mitarbeiter_id
      WHERE r.report_id = :report_id
    ";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([':report_id' => (int)$report_id]);
    $bericht = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$bericht) {
      sendError(404, 'Bericht nicht gefunden');
    }
    
    $bericht = transformBerichtToFrontend($bericht);
    
    // ⭐ VERRECHNUNGEN LADEN!
    $verrStmt = $conn->prepare("
      SELECT
        verrechnung_id,
        auftrag_id,
        betrag,
        status,
        rechnungsdatum,
        bemerkung,
        created_at
      FROM verrechnungen
      WHERE auftrag_id = :auftrag_id
    ");
    
    $verrStmt->execute([':auftrag_id' => $bericht['auftrag_id']]);
    $bericht['verrechnungen'] = $verrStmt->fetchAll(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode($bericht);
    exit();
    
  } catch (PDOException $e) {
    sendError(500, 'Query failed: ' . $e->getMessage());
  }
}

// ============ CREATE BERICHT ============
function createBericht($conn) {
  $data = getJsonInput();

  if (empty($data['mitarbeiter_id']) || empty($data['auftrag_id']) ||
      empty($data['arbeitsdatum']) || empty($data['arbeitszeit'])) {
    sendError(400, 'Erforderliche Felder: mitarbeiter_id, auftrag_id, arbeitsdatum, arbeitszeit');
  }

  $arbeitszeit = (float)$data['arbeitszeit'];
  if ($arbeitszeit <= 0) {
    sendError(400, 'Arbeitszeit muss grÃƒÂ¶ÃƒÅ¸er als 0 sein');
  }

  if (!isValidDate($data['arbeitsdatum'])) {
    sendError(400, 'UngÃƒÂ¼ltiges Datum (Format: YYYY-MM-DD)');
  }

  // Check if Mitarbeiter exists
  try {
    $checkStmt = $conn->prepare("SELECT mitarbeiter_id FROM Mitarbeiter WHERE mitarbeiter_id = :id");
    $checkStmt->execute([':id' => (int)$data['mitarbeiter_id']]);
    if (!$checkStmt->fetch()) {
      sendError(400, 'Mitarbeiter nicht gefunden');
    }

    // Check if Auftrag exists
    $checkStmt = $conn->prepare("SELECT auftrag_id FROM Auftraege WHERE auftrag_id = :id");
    $checkStmt->execute([':id' => (int)$data['auftrag_id']]);
    if (!$checkStmt->fetch()) {
      sendError(400, 'Auftrag nicht gefunden');
    }

    // Insert
    $sql = "
    INSERT INTO Rapportieren
    (mitarbeiter_id, auftrag_id, arbeitsdatum, arbeitszeit, bemerkung, freigegeben, created_at, updated_at)
    VALUES (:mitarbeiter_id, :auftrag_id, :arbeitsdatum, :arbeitszeit, :bemerkung, false, NOW(), NOW())
    RETURNING report_id, mitarbeiter_id, auftrag_id, arbeitsdatum, arbeitszeit, bemerkung, freigegeben, created_at, updated_at
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
      ':mitarbeiter_id' => (int)$data['mitarbeiter_id'],
      ':auftrag_id' => (int)$data['auftrag_id'],
      ':arbeitsdatum' => $data['arbeitsdatum'],
      ':arbeitszeit' => $arbeitszeit,
      ':bemerkung' => $data['bemerkung'] ?? null
    ]);

    $neuerBericht = $stmt->fetch(PDO::FETCH_ASSOC);
    sendCreated($neuerBericht, 'Bericht erstellt');
  } catch (PDOException $e) {
    sendError(500, 'Create failed: ' . $e->getMessage());
  }
}

// ============ UPDATE BERICHT ============
function updateBericht($conn, $report_id) {
    $data = getJsonInput();

    try {
        $checkStmt = $conn->prepare("SELECT freigegeben FROM Rapportieren WHERE report_id = :id");
        $checkStmt->execute([':id' => (int)$report_id]);
        $bericht = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$bericht) {
            sendError(404, 'Bericht nicht gefunden');
        }

        if ($bericht['freigegeben']) {
            sendError(403, 'Freigegebene Berichte kÃƒÂ¶nnen nicht geÃƒÂ¤ndert werden');
        }

        $updateFields = [];
        $params = [':report_id' => (int)$report_id];

        if (isset($data['arbeitszeit'])) {
            $arbeitszeit = (float)$data['arbeitszeit'];
            if ($arbeitszeit <= 0) {
                sendError(400, 'Arbeitszeit muss grÃƒÂ¶ÃƒÅ¸er als 0 sein');
            }
            $updateFields[] = "arbeitszeit = :arbeitszeit";
            $params[':arbeitszeit'] = $arbeitszeit;
        }

        if (isset($data['arbeitsdatum'])) {
            if (!isValidDate($data['arbeitsdatum'])) {
                sendError(400, 'UngÃƒÂ¼ltiges Datum (Format: YYYY-MM-DD)');
            }
            $updateFields[] = "arbeitsdatum = :arbeitsdatum";
            $params[':arbeitsdatum'] = $data['arbeitsdatum'];
        }

        if (isset($data['bemerkung'])) {
            $updateFields[] = "bemerkung = :bemerkung";
            $params[':bemerkung'] = $data['bemerkung'] ?? null;
        }

        if (isset($data['mitarbeiter_id'])) {
            $checkStmt = $conn->prepare("SELECT mitarbeiter_id FROM Mitarbeiter WHERE mitarbeiter_id = :id");
            $checkStmt->execute([':id' => (int)$data['mitarbeiter_id']]);
            if (!$checkStmt->fetch()) {
                sendError(400, 'Mitarbeiter nicht gefunden');
            }
            $updateFields[] = "mitarbeiter_id = :mitarbeiter_id";
            $params[':mitarbeiter_id'] = (int)$data['mitarbeiter_id'];
        }

        if (isset($data['auftrag_id'])) {
            $checkStmt = $conn->prepare("SELECT auftrag_id FROM Auftraege WHERE auftrag_id = :id");
            $checkStmt->execute([':id' => (int)$data['auftrag_id']]);
            if (!$checkStmt->fetch()) {
                sendError(400, 'Auftrag nicht gefunden');
            }
            $updateFields[] = "auftrag_id = :auftrag_id";
            $params[':auftrag_id'] = (int)$data['auftrag_id'];
        }

        if (isset($data['freigegeben'])) {
            $updateFields[] = "freigegeben = :freigegeben";
            $params[':freigegeben'] = (bool)$data['freigegeben'];
        }

        if (empty($updateFields)) {
            sendError(400, 'Keine Felder zum Aktualisieren');
        }

        $updateFields[] = "updated_at = NOW()";
        $sql = "UPDATE Rapportieren SET " . implode(', ', $updateFields) . " WHERE report_id = :report_id";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        // Ã¢Â­Â WICHTIG: Hole den kompletten Bericht mit Joins zurÃƒÂ¼ck
        $sql = "
            SELECT
                r.report_id,
                r.mitarbeiter_id,
                r.freigegeben_von,
                r.auftrag_id,
                r.arbeitsdatum,
                r.arbeitszeit,
                r.bemerkung,
                r.freigegeben,
                r.created_at,
                r.updated_at,
                a.auftragsname,
                a.status as auftrag_status,
                k.kunden_id,
                k.vorname as kunde_vorname,
                k.name as kunde_name,
                k.firma,
                k.addresse,
                k.plz,
                k.ort,
                k.telefonnummer,
                m.vorname,
                m.name,
                m.rolle
            FROM Rapportieren r
            JOIN Auftraege a ON r.auftrag_id = a.auftrag_id
            JOIN Kunde k ON a.kunden_id = k.kunden_id
            JOIN Mitarbeiter m ON r.mitarbeiter_id = m.mitarbeiter_id
            WHERE r.report_id = :report_id
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([':report_id' => (int)$report_id]);
        $updatedBericht = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$updatedBericht) {
            sendError(404, 'Bericht nach Update nicht gefunden');
        }

        // Transformiere zu Frontend-Format
        $updatedBericht = transformBerichtToFrontend($updatedBericht);

        sendSuccess($updatedBericht, 'Bericht aktualisiert');

    } catch (PDOException $e) {
        sendError(500, 'Update failed: ' . $e->getMessage());
    }
}

// ============ DELETE BERICHT ============
function deleteBericht($conn, $report_id) {
  try {
    $checkStmt = $conn->prepare("SELECT freigegeben FROM Rapportieren WHERE report_id = :id");
    $checkStmt->execute([':id' => (int)$report_id]);
    $bericht = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$bericht) {
      sendError(404, 'Bericht nicht gefunden');
    }

    if ($bericht['freigegeben']) {
      sendError(403, 'Freigegebene Berichte kÃƒÂ¶nnen nicht gelÃƒÂ¶scht werden');
    }

    $stmt = $conn->prepare("DELETE FROM Rapportieren WHERE report_id = :id");
    $stmt->execute([':id' => (int)$report_id]);

    if ($stmt->rowCount() === 0) {
      sendError(404, 'Bericht nicht gefunden');
    }

    sendSuccess([], 'Bericht gelÃƒÂ¶scht');
  } catch (PDOException $e) {
    sendError(500, 'Delete failed: ' . $e->getMessage());
  }
}

// ============ HELPER FUNCTIONS ============

/**
 * Transform DB-Bericht zu Frontend-Format mit Kundendetails
 */
function transformBerichtToFrontend($b) {
    return [
        'id' => (int)$b['report_id'],
        'arbeitsdatum' => $b['arbeitsdatum'],
        'zeitraum' => date('d.m.Y', strtotime($b['arbeitsdatum'])),
        'arbeitszeit' => (float)$b['arbeitszeit'],
        'bemerkung' => $b['bemerkung'] ?? '',
        'beschreibung' => $b['bemerkung'] ?? '',
        'mitarbeiter_id' => (int)$b['mitarbeiter_id'],
        'mitarbeiter' => trim($b['vorname'] . ' ' . $b['name']),
        'auftrag_id' => (int)$b['auftrag_id'],
        'auftragId' => (int)$b['auftrag_id'],
        'auftragsname' => $b['auftragsname'],
        'auftrag_status' => $b['auftrag_status'],
        'freigegeben' => (bool)$b['freigegeben'],
        'freigegeben_von' => $b['freigegeben_von'],
        'created_at' => $b['created_at'],
        'updated_at' => $b['updated_at'],
        'kunde' => [
            'id' => (int)$b['kunden_id'],
            'kunden_id' => (int)$b['kunden_id'],
            'vorname' => $b['kunde_vorname'],
            'name' => $b['kunde_name'],
            'firma' => $b['firma'],
            'addresse' => $b['addresse'],
            'plz' => $b['plz'],
            'ort' => $b['ort'],
            'telefonnummer' => $b['telefonnummer'] ?? ''
        ],
        'typ' => 'AuftrÃƒÂ¤ge',
        'titel' => $b['auftragsname']
    ];
}

/**
 * Validiert Datum-Format YYYY-MM-DD
 */
function isValidDate($date) {
  $d = DateTime::createFromFormat('Y-m-d', $date);
  return $d && $d->format('Y-m-d') === $date;
}

/**
 * Formatiert Datum fÃƒÂ¼r Frontend (dd.mm.yyyy)
 */
function formatDate($date) {
  return date('d.m.Y', strtotime($date));
}

/**
 * Parse JSON Input
 */
function getJsonInput() {
  $input = file_get_contents('php://input');
  return json_decode($input, true) ?? [];
}

?>