<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['success' => false, 'message' => 'Only POST requests are allowed.']);
    exit;
}

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please log in first.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) $data = [];
$userId = (int) $_SESSION['user_id'];
$action = strtolower(trim((string) ($data['action'] ?? '')));

/* Donor confirms/rejects an organisation's request. */
if ($action !== '') {
    if (($_SESSION['user_role'] ?? '') !== 'donor') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only the donor can confirm or reject a request.']);
        exit;
    }

    $requestId = filter_var($data['request_id'] ?? null, FILTER_VALIDATE_INT);
    if (!$requestId || $requestId < 1 || !in_array($action, ['confirm', 'reject'], true)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'A valid request ID and action are required.']);
        exit;
    }

    try {
        $pdo->beginTransaction();
        $find = $pdo->prepare(
            "SELECT fr.id AS request_id, fr.status AS request_status,
                    fl.id AS listing_id, fl.donor_id, fl.status AS listing_status
             FROM food_requests fr
             INNER JOIN food_listings fl ON fl.id = fr.food_id
             WHERE fr.id = :request_id AND fl.donor_id = :donor_id
             LIMIT 1 FOR UPDATE"
        );
        $find->execute(['request_id' => $requestId, 'donor_id' => $userId]);
        $request = $find->fetch(PDO::FETCH_ASSOC);

        if (!$request) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Request not found for your donations.']);
            exit;
        }
        if ($request['request_status'] !== 'pending') {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'This request has already been handled.']);
            exit;
        }

        if ($action === 'confirm') {
            if ($request['listing_status'] !== 'available') {
                $pdo->rollBack();
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'This food listing is no longer available to confirm.']);
                exit;
            }

            $updateRequest = $pdo->prepare("UPDATE food_requests SET status = 'approved' WHERE id = :id AND status = 'pending'");
            $updateRequest->execute(['id' => $requestId]);
            if ($updateRequest->rowCount() !== 1) {
                throw new RuntimeException('This request was updated by another action. Please refresh the dashboard.');
            }

            $updateListing = $pdo->prepare("UPDATE food_listings SET status = 'requested' WHERE id = :id AND status = 'available'");
            $updateListing->execute(['id' => $request['listing_id']]);
            if ($updateListing->rowCount() !== 1) {
                throw new RuntimeException('The food listing is no longer available. Please refresh the dashboard.');
            }

            // Reject any other pending requests for the same listing after one is confirmed.
            $rejectOthers = $pdo->prepare(
                "UPDATE food_requests SET status = 'rejected'
                 WHERE food_id = :food_id AND id <> :request_id AND status = 'pending'"
            );
            $rejectOthers->execute(['food_id' => $request['listing_id'], 'request_id' => $requestId]);
            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Donation confirmed. Your total donations and rank have been updated.']);
            exit;
        }

        $updateRequest = $pdo->prepare("UPDATE food_requests SET status = 'rejected' WHERE id = :id AND status = 'pending'");
        $updateRequest->execute(['id' => $requestId]);
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Food request rejected.']);
        exit;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Unable to update this request. Please check the database status values and try again.']);
        exit;
    }
}

/* Organisation creates a request. This preserves the existing requests.php endpoint. */
if (($_SESSION['user_role'] ?? '') !== 'organisation') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Only registered organisations can request food.']);
    exit;
}

$foodId = filter_var($data['food_id'] ?? null, FILTER_VALIDATE_INT);
if (!$foodId || $foodId < 1) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'A valid food listing ID is required.']);
    exit;
}

try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
        "SELECT id FROM food_listings
         WHERE id = :id AND status = 'available' AND collect_before > NOW()
         LIMIT 1 FOR UPDATE"
    );
    $stmt->execute(['id' => $foodId]);
    if (!$stmt->fetch()) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'This food listing is no longer available.']);
        exit;
    }

    $insert = $pdo->prepare(
        "INSERT INTO food_requests (food_id, requester_id, status)
         VALUES (:food_id, :requester_id, 'pending')"
    );
    $insert->execute(['food_id' => $foodId, 'requester_id' => $userId]);
    $pdo->commit();
    http_response_code(201);
    echo json_encode(['success' => true, 'message' => 'Food request submitted successfully.']);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if ($e->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'You may have already requested this food.']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Unable to submit the food request. Ensure food_requests.status supports pending/confirmed/rejected/completed.']);
    }
}
