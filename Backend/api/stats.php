
<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../db.php';

try {
    $meals = (int) $pdo->query(
        "SELECT COUNT(*) FROM food_listings WHERE status = 'completed'"
    )->fetchColumn();

    $donations = (int) $pdo->query(
        "SELECT COUNT(*) FROM food_listings WHERE status = 'completed'"
    )->fetchColumn();

    $donors = (int) $pdo->query(
        "SELECT COUNT(*) FROM users WHERE role = 'donor'"
    )->fetchColumn();

    $organisations = (int) $pdo->query(
        "SELECT COUNT(*) FROM users WHERE role = 'organisation'"
    )->fetchColumn();

    echo json_encode([
        'success' => true,
        'stats' => [
            'total_meals' => $meals,
            'total_donations' => $donations,
            'total_donors' => $donors,
            'total_organisations' => $organisations
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to load statistics.'
    ]);
}
