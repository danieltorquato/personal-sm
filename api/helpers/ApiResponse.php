<?php
class ApiResponse {
    // Resposta de sucesso
    public static function success($message, $data = null, $statusCode = 200) {
        http_response_code($statusCode);
        return json_encode([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ]);
    }

    // Resposta de erro
    public static function error($message, $statusCode = 400) {
        http_response_code($statusCode);
        return json_encode([
            'status' => 'error',
            'message' => $message
        ]);
    }

    // Resposta de não autorizado
    public static function unauthorized($message = "Não autorizado") {
        return self::error($message, 401);
    }

    // Resposta de não encontrado
    public static function notFound($message = "Recurso não encontrado") {
        return self::error($message, 404);
    }

    // Resposta de erro de servidor
    public static function serverError($message = "Erro interno do servidor") {
        return self::error($message, 500);
    }
}
?>
