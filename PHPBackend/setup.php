<?php
require_once 'config.php';

// ⚠️ NUR ZUM SETUP/MIGRATION VERWENDEN, dann löschen!

try {
    $conn = getDBConnection();
    
    echo "🔄 Datenbank wird migriert...<br>";
    
    // 1. Roles-Tabelle ERSTELLEN (falls nicht vorhanden)
    $conn->exec("
        CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL
        )
    ");
    echo "✅ Roles-Tabelle OK<br>";
    
    // 2. role_id Spalte zu users hinzufügen (falls nicht vorhanden)
    $conn->exec("
        DO \$\$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='users' AND column_name='role_id'
            ) THEN
                ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id);
            END IF;
        END\$\$;
    ");
    echo "✅ role_id Spalte zu users hinzugefügt<br>";
    
    // 3. Demo-Rollen einfügen
    $roles = ['geschaeftsleiter', 'bereichsleiter', 'mitarbeiter', 'administration'];
    foreach ($roles as $role) {
        $stmt = $conn->prepare(
            "INSERT INTO roles (name) VALUES (:name) ON CONFLICT (name) DO NOTHING"
        );
        $stmt->execute([':name' => $role]);
    }
    echo "✅ Rollen eingefügt<br>";
    
    // 4. Demo-Users mit Rollen
    $demoUsers = [
        ['email' => 'geschaeftsleiter@ava.com', 'name' => 'Arnis Morina', 'password' => 'Morina123!', 'role' => 'geschaeftsleiter'],
        ['email' => 'bereichsleiter@ava.com', 'name' => 'Vedran Jerkovic', 'password' => 'Jerkovic123!', 'role' => 'bereichsleiter'],
        ['email' => 'mitarbeiter@ava.com', 'name' => 'Alessio Fluri', 'password' => 'Fluri123!', 'role' => 'mitarbeiter'],
        ['email' => 'administration@ava.com', 'name' => 'John Doe', 'password' => 'Doe123!', 'role' => 'administration']
    ];
    
    foreach ($demoUsers as $user) {
        $passwordHash = password_hash($user['password'], PASSWORD_BCRYPT);
        
        // User einfügen/aktualisieren MIT Rolle
        $stmt = $conn->prepare('
            INSERT INTO users (email, name, password_hash, role_id) 
            VALUES (:email, :name, :hash, (SELECT id FROM roles WHERE name = :role))
            ON CONFLICT (email) DO UPDATE SET 
            password_hash = EXCLUDED.password_hash,
            role_id = (SELECT id FROM roles WHERE name = :role)
        ');
        
        $stmt->execute([
            ':email' => $user['email'],
            ':name' => $user['name'],
            ':hash' => $passwordHash,
            ':role' => $user['role']
        ]);
    }
    
    echo "<br>🎉 <strong>ERFOLG!</strong> Users + Rollen migriert:<br>";
    echo "- GL: geschaeftsleiter@ava.com (Morina123!)<br>";
    echo "- BL: bereichsleiter@ava.com (Jerkovic123!)<br>";
    echo "- MA: mitarbeiter@ava.com (Fluri123!)<br>";
    echo "- Admin: administration@ava.com (Doe123!)";
    
} catch (Exception $e) {
    echo "❌ FEHLER: " . $e->getMessage();
}
?>
