
<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../db.php';

// Only logged-in admins can access this API.
if (empty($_SESSION['user_id']) || ($_SESSION['user_role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Admin access required.'
    ]);
    exit;
}

try {
    // Verify the current role from the database.
    $check = $pdo->prepare(
        'SELECT id, name, email, role, created_at
         FROM users WHERE id = :id LIMIT 1'
    );
    $check->execute(['id' => (int) $_SESSION['user_id']]);
    $admin = $check->fetch();

    if (!$admin || $admin['role'] !== 'admin') {
        $_SESSION = [];
        session_destroy();

        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Admin access required.'
        ]);
        exit;
    }

    $stats = [];

    $stats['total_users'] = (int) $pdo
        ->query('SELECT COUNT(*) FROM users')
        ->fetchColumn();

    $stats['total_donors'] = (int) $pdo
        ->query("SELECT COUNT(*) FROM users WHERE role = 'donor'")
        ->fetchColumn();

    $stats['total_organisations'] = (int) $pdo
        ->query("SELECT COUNT(*) FROM users WHERE role = 'organisation'")
        ->fetchColumn();

    $stats['total_listings'] = (int) $pdo
        ->query('SELECT COUNT(*) FROM food_listings')
        ->fetchColumn();

    $stats['available_food'] = (int) $pdo
        ->query("SELECT COUNT(*) FROM food_listings WHERE status = 'available' AND collect_before > NOW()")
        ->fetchColumn();

    $stats['total_requests'] = (int) $pdo
        ->query('SELECT COUNT(*) FROM food_requests')
        ->fetchColumn();

    $stats['pending_requests'] = (int) $pdo
        ->query("SELECT COUNT(*) FROM food_requests WHERE status = 'pending'")
        ->fetchColumn();

    $users = $pdo->query(
        'SELECT id, name, email, phone, city, role, created_at
         FROM users ORDER BY created_at DESC LIMIT 100'
    )->fetchAll();

    $listings = $pdo->query(
        'SELECT f.id, f.title, f.kind, f.qty, f.addr,
                f.collect_before, f.status, f.created_at,
                u.name AS donor_name
         FROM food_listings f
         LEFT JOIN users u ON u.id = f.donor_id
         ORDER BY f.created_at DESC LIMIT 100'
    )->fetchAll();

    $requests = $pdo->query(
        'SELECT r.id, r.food_id, r.requester_id, r.status,
                r.created_at, r.updated_at,
                f.title AS food_title,
                u.name AS requester_name
         FROM food_requests r
         LEFT JOIN food_listings f ON f.id = r.food_id
         LEFT JOIN users u ON u.id = r.requester_id
         ORDER BY r.created_at DESC LIMIT 100'
    )->fetchAll();

    echo json_encode([
        'success' => true,
        'admin' => [
            'name' => $admin['name'],
            'email' => $admin['email'],
            'created_at' => $admin['created_at']
        ],
        'stats' => $stats,
        'users' => $users,
        'listings' => $listings,
        'requests' => $requests
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Unable to load admin dashboard.'
    ]);
}
