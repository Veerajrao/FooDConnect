<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../db.php';

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please log in to view your dashboard.']);
    exit;
}

$userId = (int) $_SESSION['user_id'];

try {
    $userStmt = $pdo->prepare('SELECT id, name, email, role FROM users WHERE id = :id LIMIT 1');
    $userStmt->execute(['id' => $userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User account not found.']);
        exit;
    }

    $stats = [
        'total_listings' => 0,
        'active_listings' => 0,
        'completed_requests' => 0,
        'total_donations' => 0,
        'donor_rank' => null,
    ];
    $incomingRequests = [];

    if ($user['role'] === 'donor') {
        // A donation is counted once a donor confirms an organisation's request.
        // Completed donations remain included in the total.
        $totalStmt = $pdo->prepare(
            "SELECT COUNT(*)
             FROM food_requests fr
             INNER JOIN food_listings fl ON fl.id = fr.food_id
             WHERE fl.donor_id = :donor_id
               AND fr.status IN ('approved', 'completed')"
        );
        $totalStmt->execute(['donor_id' => $userId]);
        $stats['total_donations'] = (int) $totalStmt->fetchColumn();

        // Rank donors by confirmed/completed requests; ties share the same rank.
        $rankStmt = $pdo->prepare(
            "SELECT 1 + COUNT(*)
             FROM (
                 SELECT fl2.donor_id, COUNT(*) AS donation_count
                 FROM food_requests fr2
                 INNER JOIN food_listings fl2 ON fl2.id = fr2.food_id
                 WHERE fr2.status IN ('approved', 'completed')
                 GROUP BY fl2.donor_id
             ) donor_totals
             WHERE donor_totals.donation_count > :my_total"
        );
        $rankStmt->execute(['my_total' => $stats['total_donations']]);
        $rank = (int) $rankStmt->fetchColumn();
        // Only rank donors who have at least one confirmed donation.
        $stats['donor_rank'] = $stats['total_donations'] > 0 ? $rank : null;

        $pendingStmt = $pdo->prepare(
            "SELECT fr.id AS request_id,
                    fl.id AS listing_id,
                    fl.id AS food_id,
                    fl.title AS food_name,
                    fl.qty,
                    fl.kind,
                    fl.addr,
                    fl.collect_before,
                    fr.status,
                    fr.created_at AS requested_at,
                    requester.name AS organisation_name
             FROM food_requests fr
             INNER JOIN food_listings fl ON fl.id = fr.food_id
             INNER JOIN users requester ON requester.id = fr.requester_id
             WHERE fl.donor_id = :donor_id
               AND fr.status = 'pending'
             ORDER BY fr.created_at DESC"
        );
        $pendingStmt->execute(['donor_id' => $userId]);
        $incomingRequests = $pendingStmt->fetchAll(PDO::FETCH_ASSOC);

        $listingStmt = $pdo->prepare('SELECT COUNT(*) FROM food_listings WHERE donor_id = :id');
        $listingStmt->execute(['id' => $userId]);
        $stats['total_listings'] = (int) $listingStmt->fetchColumn();

        $activeStmt = $pdo->prepare(
            "SELECT COUNT(*) FROM food_listings
             WHERE donor_id = :id AND status = 'available' AND collect_before > NOW()"
        );
        $activeStmt->execute(['id' => $userId]);
        $stats['active_listings'] = (int) $activeStmt->fetchColumn();
    } elseif ($user['role'] === 'organisation') {
        $completedStmt = $pdo->prepare(
            "SELECT COUNT(*) FROM food_requests WHERE requester_id = :id AND status IN ('approved', 'completed')"
        );
        $completedStmt->execute(['id' => $userId]);
        $stats['completed_requests'] = (int) $completedStmt->fetchColumn();
    }

    echo json_encode([
        'success' => true,
        'user' => $user,
        'stats' => $stats,
        'incoming_requests' => $incomingRequests,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to load dashboard.']);
}
