
<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

// Allow only POST requests.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');

    echo json_encode([
        'success' => false,
        'message' => 'Only POST requests are allowed.'
    ]);
    exit;
}

// Remove all session data.
$_SESSION = [];

// Expire the session cookie using its existing settings.
if (ini_get('session.use_cookies')) {
    $cookie = session_get_cookie_params();

    setcookie(
        session_name(),
        '',
        [
            'expires' => time() - 42000,
            'path' => $cookie['path'],
            'domain' => $cookie['domain'],
            'secure' => $cookie['secure'],
            'httponly' => $cookie['httponly'],
            'samesite' => $cookie['samesite'] ?? 'Lax'
        ]
    );
}

// Destroy the server-side session.
$destroyed = session_destroy();

if (!$destroyed) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to destroy the session.'
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully.'
]);
