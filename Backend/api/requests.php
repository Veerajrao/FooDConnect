
<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');

    echo json_encode([
        'success' => false,
        'message' => 'Only POST requests are allowed.'
    ]);
    exit;
}

if (empty($_SESSION['user_id'])) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Please log in before requesting food.'
    ]);
    exit;
}

if (($_SESSION['user_role'] ?? '') !== 'organisation') {
    http_response_code(403);

    echo json_encode([
        'success' => false,
        'message' => 'Only registered organisations can request food.'
    ]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$foodId = filter_var(
    $data['food_id'] ?? null,
    FILTER_VALIDATE_INT
);

if (!$foodId || $foodId < 1) {
    http_response_code(422);

    echo json_encode([
        'success' => false,
        'message' => 'A valid food listing ID is required.'
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "SELECT id
         FROM food_listings
         WHERE id = :id
           AND status = 'available'
           AND collect_before > NOW()
         LIMIT 1"
    );

    $stmt->execute(['id' => $foodId]);

    if (!$stmt->fetch()) {
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'This food listing is no longer available.'
        ]);
        exit;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO food_requests (food_id, requester_id)
         VALUES (:food_id, :requester_id)'
    );

    $stmt->execute([
        'food_id' => $foodId,
        'requester_id' => (int) $_SESSION['user_id']
    ]);

    http_response_code(201);

    echo json_encode([
        'success' => true,
        'message' => 'Food request submitted successfully.'
    ]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        http_response_code(409);

        echo json_encode([
            'success' => false,
            'message' => 'You may have already requested this food.'
        ]);
    } else {
        http_response_code(500);

        echo json_encode([
            'success' => false,
            'message' => 'Unable to submit your food request.'
        ]);
    }
}
