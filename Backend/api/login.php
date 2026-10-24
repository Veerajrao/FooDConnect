
<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../db.php';

function respond(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Allow only POST requests.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');

    respond(405, [
        'success' => false,
        'message' => 'Only POST requests are allowed.'
    ]);
}

// Read JSON request data.
$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    respond(400, [
        'success' => false,
        'message' => 'Invalid JSON request.'
    ]);
}

// Read login details.
$email = strtolower(trim($data['email'] ?? ''));
$password = $data['password'] ?? '';
$role = strtolower(trim($data['role'] ?? ''));

// Normalize organisation role values.
if (in_array($role, ['recipient', 'organization'], true)) {
    $role = 'organisation';
}

// Validate input.
if (
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    !is_string($password) ||
    $password === ''
) {
    respond(422, [
        'success' => false,
        'message' => 'Enter a valid email and password.'
    ]);
}

try {
    $stmt = $pdo->prepare(
        'SELECT id, name, email, password_hash, role
         FROM users
         WHERE email = :email
         LIMIT 1'
    );

    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Use the same generic error for invalid credentials.
    if (
        !$user ||
        !is_string($user['password_hash'] ?? null) ||
        !password_verify($password, $user['password_hash'])
    ) {
        respond(401, [
            'success' => false,
            'message' => 'Invalid email, password, or account type.'
        ]);
    }

    // Validate the account role.
    if (!in_array(
        $user['role'],
        ['donor', 'organisation', 'admin'],
        true
    )) {
        respond(401, [
            'success' => false,
            'message' => 'Invalid email, password, or account type.'
        ]);
    }

    // Ensure the selected role matches the account.
    if ($role !== '' && $role !== $user['role']) {
        respond(401, [
            'success' => false,
            'message' => 'Invalid email, password, or account type.'
        ]);
    }

    // Regenerate the session ID after successful authentication.
    session_regenerate_id(true);

    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_role'] = $user['role'];

    respond(200, [
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
    error_log('FoodConnect login database error: ' . $e->getMessage());

    respond(500, [
        'success' => false,
        'message' => 'Unable to log in right now.'
    ]);
}
