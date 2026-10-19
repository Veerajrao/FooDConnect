
<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../db.php';

try {
    $stmt = $pdo->query('SELECT DATABASE() AS database_name');
    $result = $stmt->fetch();

    echo json_encode([
        'success' => true,
        'message' => 'PHP connected to MySQL successfully.',
        'database' => $result['database_name']
    ]);
} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Database query failed.'
    ]);
}
