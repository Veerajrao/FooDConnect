
<?php
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

$name = trim($data['name'] ?? '');
$email = strtolower(trim($data['email'] ?? ''));
$password = $data['password'] ?? '';
$phone = trim($data['phone'] ?? '');
$city = trim($data['city'] ?? '');
$role = $data['role'] ?? '';
$accountType = trim($data['account_type'] ?? '');
$registrationNumber = trim($data['registration_number'] ?? '');

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || strlen($password) < 8
    || !in_array($role, ['donor', 'organisation'], true)) {
    http_response_code(422);

    echo json_encode([
        'success' => false,
        'message' => 'Enter valid details. Password must be at least 8 characters.'
    ]);
    exit;
}

try {
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare(
        'INSERT INTO users
         (name, email, password_hash, phone, city, role, account_type, registration_number)
         VALUES
         (:name, :email, :password_hash, :phone, :city, :role, :account_type, :registration_number)'
    );

    $stmt->execute([
        'name' => $name,
        'email' => $email,
        'password_hash' => $passwordHash,
        'phone' => $phone ?: null,
        'city' => $city ?: null,
        'role' => $role,
        'account_type' => $accountType ?: null,
        'registration_number' => $registrationNumber ?: null
    ]);

    http_response_code(201);

    echo json_encode([
        'success' => true,
        'message' => 'Registration successful.'
    ]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        http_response_code(409);

        echo json_encode([
            'success' => false,
            'message' => 'This email may already be registered.'
        ]);
    } else {
        http_response_code(500);

        echo json_encode([
            'success' => false,
            'message' => 'Unable to register this account.'
        ]);
    }
}