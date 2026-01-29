<?php
require_once 'config.php';

// ⚠️ NUR ZUM SETUP VERWENDEN, dann löschen!

try {
    $conn = getDBConnection();
    
    $demoUsers = [
        ['email' => 'geschaeftsleiter@ava.com', 'name' => 'Arnis Morina', 'password' => 'Morina123!'],
        ['email' => 'bereichsleiter@ava.com', 'name' => 'Vedran Jerkovic', 'password' => 'Jerkovic123!'],
        ['email' => 'mitarbeiter@ava.com', 'name' => 'Alessio Fluri', 'password' => 'Fluri123!'],
        ['email' => 'administration@ava.com', 'name' => 'John Doe', 'password' => 'Doe123!']
    ];
    
    foreach ($demoUsers as $user) {
        $passwordHash = password_hash($user['password'], PASSWORD_BCRYPT);
        
        $stmt = $conn->prepare(
            'INSERT INTO users (email, name, password_hash) VALUES (:email, :name, :hash) 
             ON CONFLICT (email) DO UPDATE SET password_hash = :hash'
        );
        
        $stmt->execute([
            ':email' => $user['email'],
            ':name' => $user['name'],
            ':hash' => $passwordHash
        ]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Demo users created']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
