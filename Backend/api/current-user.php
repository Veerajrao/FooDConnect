
<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../db.php';

if (empty($_SESSION['user_id'])) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Please log in first.'
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        'SELECT id, name, email, role
         FROM users
         WHERE id = :id
         LIMIT 1'
    );

    $stmt->execute([
        'id' => (int) $_SESSION['user_id']
    ]);

    $user = $stmt->fetch();

    if (!$user) {
        session_unset();
        session_destroy();

        http_response_code(401);

        echo json_encode([
            'success' => false,
            'message' => 'User account not found. Please log in again.'
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'user' => $user
    ]);
} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to retrieve account information.'
    ]);
}
