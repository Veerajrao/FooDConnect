
<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');

    echo json_encode([
        'success' => false,
        'message' => 'Only POST requests are allowed.'
    ]);
    exit;
}

// Remove session data.
$_SESSION = [];

// Expire the session cookie.
if (ini_get('session.use_cookies')) {
    $cookie = session_get_cookie_params();

    setcookie(
        session_name(),
        '',
        time() - 42000,
        $cookie['path'],
        $cookie['domain'],
        $cookie['secure'],
        $cookie['httponly']
    );
}

// Destroy the server-side session.
session_destroy();

echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully.'
]);
