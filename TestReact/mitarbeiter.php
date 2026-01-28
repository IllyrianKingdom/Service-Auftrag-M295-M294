<?php
// mitarbeiter.php - Mit require_once config.php

require_once 'config.php';

// ========== PREFLIGHT REQUEST HANDLING ==========
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ========== GET - Alle Mitarbeiter ==========
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "SELECT mitarbeiter_id, vorname, name, rolle, status, telefonnummer, email FROM Mitarbeiter ORDER BY name ASC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $mitarbeiter = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode($mitarbeiter);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    
    exit();
}

// ========== POST - Neuer Mitarbeiter ODER Update/Delete ==========
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // ========== UPDATE STATUS ==========
    if (isset($_GET['update'])) {
        try {
            $mitarbeiter_id = $data['Mitarbeiter_id'] ?? null;
            $status = $data['Status'] ?? null;
            
            if (!$mitarbeiter_id || !$status) {
                throw new Exception('Mitarbeiter_id und Status erforderlich');
            }
            
            $query = "UPDATE Mitarbeiter SET status = :status WHERE mitarbeiter_id = :id";
            $stmt = $conn->prepare($query);
            $stmt->execute([':status' => $status, ':id' => $mitarbeiter_id]);
            
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Status aktualisiert']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit();
    }
    
    // ========== DELETE ==========
    if (isset($_GET['delete'])) {
        try {
            $mitarbeiter_id = $data['Mitarbeiter_id'] ?? null;
            if (!$mitarbeiter_id) {
                throw new Exception('Mitarbeiter_id erforderlich');
            }
            
            $query = "DELETE FROM Mitarbeiter WHERE mitarbeiter_id = :id";
            $stmt = $conn->prepare($query);
            $stmt->execute([':id' => $mitarbeiter_id]);
            
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Mitarbeiter gelöscht']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit();
    }
    
    // ========== CREATE - Neuer Mitarbeiter ==========
    try {
        $vorname = $data['Vorname'] ?? '';
        $name = $data['Name'] ?? null;
        $rolle = $data['Rolle'] ?? 'MA';
        $status = $data['Status'] ?? 'Aktiv';
        $telefonnummer = $data['Telefonnummer'] ?? '';
        $email = $data['Email'] ?? '';
        
        if (!$name) {
            throw new Exception('Name erforderlich');
        }
        
        $query = "INSERT INTO Mitarbeiter (vorname, name, rolle, status, telefonnummer, email) 
                  VALUES (:vorname, :name, :rolle, :status, :telefonnummer, :email)";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            ':vorname' => $vorname,
            ':name' => $name,
            ':rolle' => $rolle,
            ':status' => $status,
            ':telefonnummer' => $telefonnummer,
            ':email' => $email
        ]);
        
        $mitarbeiter_id = $conn->lastInsertId();
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Mitarbeiter erstellt',
            'id' => $mitarbeiter_id
        ]);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Methode nicht erlaubt']);
?>