<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');

include 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("
        INSERT INTO berichte (typ, titel, beschreibung, zeitraum, anzahl, auftrag_id) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['typ'], $data['titel'], $data['beschreibung'], 
        $data['zeitraum'], $data['anzahl'], $data['auftragId']
    ]);
    
    echo json_encode(['id' => $pdo->lastInsertId()]);
}
?>
