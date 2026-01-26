<?php
/**
 * DEBUG Test - Upload zu /htdocs/api/debug.php
 * Zeigt dir deinen API Key Status
 */

// ========== CONFIG - UPDATE DEIN SUPABASE KEY HIER! ==========
$supabase_url = 'https://mgxaqgxtwuuczouvrzjb.supabase.co';
$supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1neGFxZ3h0d3V1Y3pvdXZyempiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjUwNjMsImV4cCI6MjA4Mzk0MTA2M30.KgV4A1G88vU_Ur457UpLx-LU3VAB2T5hcWKJrDiv8bM'; // ← CHANGE THIS!

header('Content-Type: application/json');

// Test 1: Key prüfen
echo json_encode([
    'test' => 'API Key Status',
    'key_set' => !empty($supabase_key) && $supabase_key !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1neGFxZ3h0d3V1Y3pvdXZyempiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjUwNjMsImV4cCI6MjA4Mzk0MTA2M30.KgV4A1G88vU_Ur457UpLx-LU3VAB2T5hcWKJrDiv8bM',
    'key_length' => strlen($supabase_key),
    'key_preview' => substr($supabase_key, 0, 20) . '...',
    'url' => $supabase_url,
    'instructions' => [
        '1. Go to: https://app.supabase.com',
        '2. Select your project: mgxaqgxtwuuczouvrzjb',
        '3. Go to: Settings → API',
        '4. Copy the "anon public" key',
        '5. Replace "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1neGFxZ3h0d3V1Y3pvdXZyempiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjUwNjMsImV4cCI6MjA4Mzk0MTA2M30.KgV4A1G88vU_Ur457UpLx-LU3VAB2T5hcWKJrDiv8bM" in this file (line 8)',
        '6. Important: The key should start with "eyJ..."',
        '7. Paste the FULL key, not just part of it'
    ]
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>