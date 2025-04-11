<?php
/**
 * Helper de autenticação para verificar tokens JWT e extrair informações do usuário
 */
class AuthHelper {
    private $secretKey;

    public function __construct() {
        // Chave secreta para JWT - deve ser armazenada em ambiente seguro em produção
        $this->secretKey = "SEU_SEGREDO_JWT_AQUI"; // Substitua por uma chave segura em produção
    }

    /**
     * Extrai o token do cabeçalho Authorization
     * @return string|null Token extraído ou null
     */
    private function getBearerToken() {
        $headers = null;

        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER['Authorization']);
        } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
        } else if (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(
                array_map('ucwords', array_keys($requestHeaders)),
                array_values($requestHeaders)
            );

            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }

        // Forma alternativa de obter o cabeçalho
        if (!$headers && function_exists('getallheaders')) {
            $allHeaders = getallheaders();
            if (isset($allHeaders['Authorization'])) {
                $headers = trim($allHeaders['Authorization']);
            } else if (isset($allHeaders['authorization'])) {
                $headers = trim($allHeaders['authorization']);
            }
        }

        if (!empty($headers) && preg_match('/Bearer\s+(.*)$/i', $headers, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Decodifica o token JWT e retorna os dados do usuário
     * @return array|null Dados do usuário ou null
     */
    public function getUserFromToken() {
        $token = $this->getBearerToken();

        if (!$token) {
            return null;
        }

        try {
            // Decodificar token JWT
            $tokenParts = explode('.', $token);

            if (count($tokenParts) != 3) {
                return null;
            }

            // Decodificar a parte de payload do token
            $payload = json_decode(base64_decode($tokenParts[1]), true);

            // Verificar se o token é válido e não expirou
            if (!isset($payload['exp']) || $payload['exp'] < time()) {
                return null;
            }

            // Retornar dados do usuário
            return [
                'id' => $payload['user_id'] ?? null,
                'email' => $payload['email'] ?? null,
                'name' => $payload['name'] ?? null,
                'role' => $payload['role'] ?? null,
                'type_name' => $payload['role'] ?? null // Adicionado type_name como alias para role
            ];

        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Gera um token JWT para o usuário
     * @param array $userData Dados do usuário
     * @param int $expireTime Tempo de expiração em segundos
     * @return string Token JWT
     */
    public function generateToken($userData, $expireTime = 86400) {
        $issuedAt = time();
        $expirationTime = $issuedAt + $expireTime; // 24 horas por padrão

        $payload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'user_id' => $userData['id'],
            'email' => $userData['email'],
            'name' => $userData['name'],
            'role' => $userData['role']
        ];

        // Codificar cabeçalho
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));

        // Codificar payload
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));

        // Gerar assinatura
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secretKey, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        // Criar token
        $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

        return $jwt;
    }

    /**
     * Verifica se o usuário tem um papel específico
     * @param string $role Papel a verificar
     * @return bool Verdadeiro se o usuário tem o papel
     */
    public function userHasRole($role) {
        $userData = $this->getUserFromToken();

        if (!$userData) {
            return false;
        }

        return $userData['role'] === $role;
    }
}
?>
