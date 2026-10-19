
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

$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON request.'
    ]);
    exit;
}

$email = strtolower(trim($data['email'] ?? ''));
$password = $data['password'] ?? '';
$role = $data['role'] ?? '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
    http_response_code(422);

    echo json_encode([
        'success' => false,
        'message' => 'Enter a valid email and password.'
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        'SELECT id, name, email, password_hash, role
         FROM users
         WHERE email = :email
         LIMIT 1'
    );

    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    if (
        !$user ||
        !password_verify($password, $user['password_hash']) ||
        !in_array($user['role'], ['donor', 'organisation'], true) ||
        ($role !== '' && $role !== $user['role'])
    ) {
        http_response_code(401);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid email, password, or account type.'
        ]);
        exit;
    }

    session_regenerate_id(true);

    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_role'] = $user['role'];

    echo json_encode([
        'success' => true,
        'message' => 'Login successful.',
        'user' => [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role']
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to log in right now.'
    ]);
}
