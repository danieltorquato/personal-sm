<?php
require_once __DIR__ . '../../models/User.php';
require_once __DIR__ . '../../helpers/ApiResponse.php';

class UserController {
    private $user;
    private $db;

    public function __construct($db) {
        $this->db = $db;
        $this->user = new User();
    }

    // Login de usuário
    public function login() {
        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->email) || !isset($data->password)) {
            return ApiResponse::error("Email e senha são obrigatórios");
        }

        // Configurar dados para login
        $this->user->email = $data->email;
        $this->user->password = $data->password;

        // Tentar fazer login
        $user_data = $this->user->login();

        if($user_data) {
          header("Location: /home.php");
            return ApiResponse::success("Login realizado com sucesso", $user_data);
        } else {
            return ApiResponse::unauthorized("Email ou senha incorretos");
        }
    }

    // Registrar novo usuário
    public function register() {
        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->name) || !isset($data->email) || !isset($data->password) || !isset($data->user_type_id)) {
            return ApiResponse::error("Dados incompletos para registro");
        }

        // Verificar se o email já existe
        $this->user->email = $data->email;
        if($this->user->emailExists()) {
            return ApiResponse::error("Email já cadastrado");
        }

        // Configurar dados para criação
        $this->user->name = $data->name;
        $this->user->email = $data->email;
        $this->user->password = $data->password;
        $this->user->phone = $data->phone ?? null;
        $this->user->user_type_id = $data->user_type_id;

        // Tentar criar usuário
        $user_id = $this->user->create();

        if($user_id) {
            // Criar configurações padrão para o usuário
            $this->createDefaultSettings($user_id);

            return ApiResponse::success("Usuário registrado com sucesso", ["id" => $user_id], 201);
        } else {
            return ApiResponse::serverError("Erro ao registrar usuário");
        }
    }

    // Criar configurações padrão para o usuário
    private function createDefaultSettings($user_id) {
        $query = "INSERT INTO user_settings (user_id) VALUES (:user_id)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        return $stmt->execute();
    }

    // Obter detalhes do usuário
    public function getProfile() {
        // Verificar autenticação
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? '';

        if(empty($token)) {
            return ApiResponse::unauthorized("Token não fornecido");
        }

        $token = str_replace("Bearer ", "", $token);
        $user_data = $this->user->validateToken($token);

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        return ApiResponse::success("Perfil obtido com sucesso", $user_data);
    }

    // Atualizar perfil de usuário
    public function updateProfile() {
        // Verificar autenticação
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? '';

        if(empty($token)) {
            return ApiResponse::unauthorized("Token não fornecido");
        }

        $token = str_replace("Bearer ", "", $token);
        $user_data = $this->user->validateToken($token);

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data) {
            return ApiResponse::error("Nenhum dado fornecido para atualização");
        }

        // Configurar dados para atualização
        $this->user->id = $user_data['id'];
        $this->user->name = $data->name ?? $user_data['name'];
        $this->user->phone = $data->phone ?? $user_data['phone'];
        $this->user->profile_picture = $data->profile_picture ?? $user_data['profile_picture'];
        $this->user->birthdate = $data->birthdate ?? $user_data['birthdate'];
        $this->user->is_active = $user_data['is_active'];

        // Tentar atualizar usuário
        if($this->user->update()) {
            return ApiResponse::success("Perfil atualizado com sucesso");
        } else {
            return ApiResponse::serverError("Erro ao atualizar perfil");
        }
    }

    // Alterar senha
    public function changePassword() {
        // Verificar autenticação
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? '';

        if(empty($token)) {
            return ApiResponse::unauthorized("Token não fornecido");
        }

        $token = str_replace("Bearer ", "", $token);
        $user_data = $this->user->validateToken($token);

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->current_password) || !isset($data->new_password)) {
            return ApiResponse::error("Senha atual e nova senha são obrigatórias");
        }

        // Verificar senha atual
        $this->user->email = $user_data['email'];
        $this->user->password = $data->current_password;
        $check_login = $this->user->login();

        if(!$check_login) {
            return ApiResponse::error("Senha atual incorreta");
        }

        // Atualizar senha
        $this->user->id = $user_data['id'];
        $this->user->password = $data->new_password;

        if($this->user->updatePassword()) {
            return ApiResponse::success("Senha alterada com sucesso");
        } else {
            return ApiResponse::serverError("Erro ao alterar senha");
        }
    }

    // Listar personais
    public function listTrainers() {
        $stmt = $this->user->readAllTrainers();
        $trainers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return ApiResponse::success("Personais obtidos com sucesso", $trainers);
    }

    // Listar alunos
    public function listStudents() {
        // Verificar autenticação
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? '';

        if(empty($token)) {
            return ApiResponse::unauthorized("Token não fornecido");
        }

        $token = str_replace("Bearer ", "", $token);
        $user_data = $this->user->validateToken($token);

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar tipo de usuário
        if($user_data['type_name'] == 'trainer') {
            // Listar alunos do personal
            $this->user->id = $user_data['id'];
            $stmt = $this->user->readTrainerStudents();
        } else if($user_data['type_name'] == 'admin') {
            // Listar todos os alunos
            $stmt = $this->user->readAllStudents();
        } else {
            return ApiResponse::unauthorized("Acesso não autorizado");
        }

        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return ApiResponse::success("Alunos obtidos com sucesso", $students);
    }

    // Obter personal do aluno
    public function getStudentTrainer() {
        // Verificar autenticação
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? '';

        if(empty($token)) {
            return ApiResponse::unauthorized("Token não fornecido");
        }

        $token = str_replace("Bearer ", "", $token);
        $user_data = $this->user->validateToken($token);

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar tipo de usuário
        if($user_data['type_name'] != 'student') {
            return ApiResponse::unauthorized("Acesso disponível apenas para alunos");
        }

        // Obter personal do aluno
        $this->user->id = $user_data['id'];
        $stmt = $this->user->getStudentTrainer();

        if($stmt->rowCount() > 0) {
            $trainer = $stmt->fetch(PDO::FETCH_ASSOC);
            return ApiResponse::success("Personal obtido com sucesso", $trainer);
        } else {
            return ApiResponse::notFound("Nenhum personal encontrado para este aluno");
        }
    }

    // Atribuir aluno a um personal
    public function assignStudentToTrainer() {
        // Verificar autenticação
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? '';

        if(empty($token)) {
            return ApiResponse::unauthorized("Token não fornecido");
        }

        $token = str_replace("Bearer ", "", $token);
        $user_data = $this->user->validateToken($token);

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar tipo de usuário
        if($user_data['type_name'] != 'admin' && $user_data['type_name'] != 'trainer') {
            return ApiResponse::unauthorized("Acesso não autorizado");
        }

        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->student_id) || !isset($data->trainer_id)) {
            return ApiResponse::error("ID do aluno e ID do personal são obrigatórios");
        }

        // Para personais, verificar se o ID do personal é o dele mesmo
        if($user_data['type_name'] == 'trainer' && $data->trainer_id != $user_data['id']) {
            return ApiResponse::unauthorized("Um personal só pode atribuir alunos a si mesmo");
        }

        // Atribuir aluno ao personal
        if($this->user->assignToTrainer($data->student_id, $data->trainer_id)) {
            return ApiResponse::success("Aluno atribuído ao personal com sucesso");
        } else {
            return ApiResponse::serverError("Erro ao atribuir aluno ao personal");
        }
    }
}
?>
