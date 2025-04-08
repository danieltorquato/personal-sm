<?php
// Cabeçalhos necessários
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Incluir arquivos necessários
include_once __DIR__ . '/../config/Database.php';
include_once __DIR__ . '/../models/Anamnesis.php';


class AnamnesisController {
    private $db;
    private $anamnesis;
    private $jwt;

    public function __construct($db) {
        // Instanciar conexão com o banco de dados
        $db = new Database();
        $this->db = $db->getConnection();

        // Instanciar objeto de anamnese
        $this->anamnesis = new Anamnesis($this->db);


    }

    // Criar nova anamnese
    public function create() {

$this->anamnesis->create();



    }

    // Atualizar anamnese existente
    public function update() {
        // Verificar token JWT
        $headers = apache_request_headers();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : '';

        if (!$token || !$this->jwt->validateToken($token)) {
            http_response_code(401);
            echo json_encode(["message" => "Não autorizado"]);
            return;
        }

        // Obter dados do usuário do token
        $userData = $this->jwt->getDecodedData($token);
        $userId = $userData->data->id;

        // Obter dados enviados
        $data = json_decode(file_get_contents("php://input"));

        // Verificar se os dados necessários foram enviados
        if (
            !isset($data->id) ||
            !isset($data->weight) ||
            !isset($data->height) ||
            !isset($data->age) ||
            !isset($data->sex)
        ) {
            http_response_code(400);
            echo json_encode(["message" => "Dados incompletos"]);
            return;
        }

        // Definir propriedades da anamnese
        $this->anamnesis->id = $data->id;
        $this->anamnesis->user_id = $userId;
        $this->anamnesis->weight = $data->weight;
        $this->anamnesis->height = $data->height;
        $this->anamnesis->age = $data->age;
        $this->anamnesis->sex = $data->sex;
        $this->anamnesis->smoker = $data->smoker ?? 0;
        $this->anamnesis->alcoholic = $data->alcoholic ?? 0;
        $this->anamnesis->physical_activity = $data->physical_activity ?? '';
        $this->anamnesis->sleep_hours = $data->sleep_hours ?? 0;
        $this->anamnesis->main_complaint = $data->main_complaint ?? '';
        $this->anamnesis->medical_history = $data->medical_history ?? '';
        $this->anamnesis->medications = $data->medications ?? '';
        $this->anamnesis->surgeries = $data->surgeries ?? '';
        $this->anamnesis->allergies = $data->allergies ?? '';
        $this->anamnesis->family_history = $data->family_history ?? '';
        $this->anamnesis->lifestyle = $data->lifestyle ?? '';

        // Atualizar anamnese
        if ($this->anamnesis->update()) {
            http_response_code(200);
            echo json_encode(["message" => "Anamnese atualizada com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao atualizar anamnese"]);
        }
    }


    // Excluir anamnese
    public function delete() {
        // Verificar token JWT
        $headers = apache_request_headers();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : '';

        if (!$token || !$this->jwt->validateToken($token)) {
            http_response_code(401);
            echo json_encode(["message" => "Não autorizado"]);
            return;
        }

        // Obter dados do usuário do token
        $userData = $this->jwt->getDecodedData($token);
        $userId = $userData->data->id;

        // Obter dados enviados
        $data = json_decode(file_get_contents("php://input"));

        // Verificar se o ID foi enviado
        if (!isset($data->id)) {
            http_response_code(400);
            echo json_encode(["message" => "ID da anamnese não fornecido"]);
            return;
        }

        // Definir propriedades da anamnese
        $this->anamnesis->id = $data->id;
        $this->anamnesis->user_id = $userId;

        // Excluir anamnese
        if ($this->anamnesis->delete()) {
            http_response_code(200);
            echo json_encode(["message" => "Anamnese excluída com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao excluir anamnese"]);
        }
    }
}
?>
