
<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../db.php';

if (empty($_SESSION['user_id'])) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Please log in to view your dashboard.'
    ]);
    exit;
}

$userId = (int) $_SESSION['user_id'];

try {
    $userStmt = $pdo->prepare(
        'SELECT id, name, email, role
         FROM users
         WHERE id = :id
         LIMIT 1'
    );

    $userStmt->execute(['id' => $userId]);
    $user = $userStmt->fetch();

    if (!$user) {
        http_response_code(401);

        echo json_encode([
            'success' => false,
            'message' => 'User account not found.'
        ]);
        exit;
    }

    $listingStmt = $pdo->prepare(
        'SELECT COUNT(*)
         FROM food_listings
         WHERE donor_id = :id'
    );

    $listingStmt->execute(['id' => $userId]);
    $totalListings = (int) $listingStmt->fetchColumn();

    $activeStmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM food_listings
         WHERE donor_id = :id
           AND status = 'available'
           AND collect_before > NOW()"
    );

    $activeStmt->execute(['id' => $userId]);
    $activeListings = (int) $activeStmt->fetchColumn();

    $requestStmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM food_requests
         WHERE requester_id = :id
           AND status = 'completed'"
    );

    $requestStmt->execute(['id' => $userId]);
    $completedRequests = (int) $requestStmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'user' => $user,
        'stats' => [
            'total_listings' => $totalListings,
            'active_listings' => $activeListings,
            'completed_requests' => $completedRequests
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to load dashboard.'
    ]);
}
