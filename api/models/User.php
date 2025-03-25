<?php
require_once '../config/Database.php';

class User {
    // Conexão com o banco e tabela
    private $conn;
    private $table_name = "users";

    // Propriedades
    public $id;
    public $name;
    public $email;
    public $password;
    public $phone;
    public $user_type_id;
    public $profile_picture;
    public $birthdate;
    public $is_active;
    public $created_at;
    public $updated_at;

    // Construtor
    public function __construct($db) {
        $this->conn = $db;
    }

    // Autenticar usuário (login)
    public function login() {
        // Query para verificar se o email existe
        $query = "SELECT u.*, ut.type_name FROM " . $this->table_name . " u
                  LEFT JOIN user_types ut ON u.user_type_id = ut.id
                  WHERE u.email = :email AND u.is_active = 1
                  LIMIT 0,1";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->email = htmlspecialchars(strip_tags($this->email));

        // Vincular
        $stmt->bindParam(":email", $this->email);

        // Executar
        $stmt->execute();

        // Verificar se encontrou
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            // Verificar senha
            if(password_verify($this->password, $row['password'])) {
                // Criar token de autenticação
                $auth_token = $this->createAuthToken($row['id']);

                // Retornar usuário sem senha
                unset($row['password']);
                $row['token'] = $auth_token;
                return $row;
            }
        }

        return false;
    }

    // Criar token de autenticação
    private function createAuthToken($user_id) {
        // Gerar token
        $token = bin2hex(random_bytes(32));

        // Data de expiração (30 dias)
        $expires = date('Y-m-d H:i:s', strtotime('+30 days'));

        // Query para inserir token
        $query = "INSERT INTO auth_tokens (user_id, token, device, expires_at)
                  VALUES (:user_id, :token, :device, :expires_at)";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar e vincular
        $user_id = htmlspecialchars(strip_tags($user_id));
        $device = htmlspecialchars(strip_tags($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'));

        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":token", $token);
        $stmt->bindParam(":device", $device);
        $stmt->bindParam(":expires_at", $expires);

        // Executar
        if($stmt->execute()) {
            return $token;
        }

        return false;
    }

    // Verificar token
    public function validateToken($token) {
        // Query para verificar token
        $query = "SELECT u.*, ut.type_name FROM auth_tokens at
                  JOIN " . $this->table_name . " u ON at.user_id = u.id
                  JOIN user_types ut ON u.user_type_id = ut.id
                  WHERE at.token = :token AND at.expires_at > NOW()
                  LIMIT 0,1";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $token = htmlspecialchars(strip_tags($token));

        // Vincular
        $stmt->bindParam(":token", $token);

        // Executar
        $stmt->execute();

        // Verificar se encontrou
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            unset($row['password']);
            return $row;
        }

        return false;
    }

    // Criar novo usuário
    public function create() {
        // Query para inserir
        $query = "INSERT INTO " . $this->table_name . "
                  (name, email, password, phone, user_type_id)
                  VALUES
                  (:name, :email, :password, :phone, :user_type_id)";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->password = htmlspecialchars(strip_tags($this->password));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->user_type_id = htmlspecialchars(strip_tags($this->user_type_id));

        // Hash da senha
        $password_hash = password_hash($this->password, PASSWORD_DEFAULT);

        // Vincular
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password", $password_hash);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":user_type_id", $this->user_type_id);

        // Executar
        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    // Atualizar usuário
    public function update() {
        // Query para atualizar
        $query = "UPDATE " . $this->table_name . "
                  SET name = :name, phone = :phone, profile_picture = :profile_picture,
                  birthdate = :birthdate, is_active = :is_active
                  WHERE id = :id";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->id = htmlspecialchars(strip_tags($this->id));
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->profile_picture = htmlspecialchars(strip_tags($this->profile_picture));
        $this->birthdate = htmlspecialchars(strip_tags($this->birthdate));
        $this->is_active = htmlspecialchars(strip_tags($this->is_active));

        // Vincular
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":profile_picture", $this->profile_picture);
        $stmt->bindParam(":birthdate", $this->birthdate);
        $stmt->bindParam(":is_active", $this->is_active);

        // Executar
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Atualizar senha
    public function updatePassword() {
        // Query para atualizar
        $query = "UPDATE " . $this->table_name . "
                  SET password = :password
                  WHERE id = :id";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->id = htmlspecialchars(strip_tags($this->id));
        $this->password = htmlspecialchars(strip_tags($this->password));

        // Hash da senha
        $password_hash = password_hash($this->password, PASSWORD_DEFAULT);

        // Vincular
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":password", $password_hash);

        // Executar
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Obter um usuário pelo ID
    public function readOne() {
        // Query
        $query = "SELECT u.*, ut.type_name FROM " . $this->table_name . " u
                  LEFT JOIN user_types ut ON u.user_type_id = ut.id
                  WHERE u.id = :id
                  LIMIT 0,1";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Vincular
        $stmt->bindParam(":id", $this->id);

        // Executar
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            // Configurar propriedades
            $this->id = $row['id'];
            $this->name = $row['name'];
            $this->email = $row['email'];
            $this->phone = $row['phone'];
            $this->user_type_id = $row['user_type_id'];
            $this->user_type = $row['type_name'];
            $this->profile_picture = $row['profile_picture'];
            $this->birthdate = $row['birthdate'];
            $this->is_active = $row['is_active'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];

            return true;
        }

        return false;
    }

    // Verificar se email já existe
    public function emailExists() {
        // Query
        $query = "SELECT id FROM " . $this->table_name . "
                  WHERE email = :email
                  LIMIT 0,1";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->email = htmlspecialchars(strip_tags($this->email));

        // Vincular
        $stmt->bindParam(":email", $this->email);

        // Executar
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    // Listar todos os personais
    public function readAllTrainers() {
        // Query
        $query = "SELECT u.id, u.name, u.email, u.phone, u.profile_picture
                  FROM " . $this->table_name . " u
                  JOIN user_types ut ON u.user_type_id = ut.id
                  WHERE ut.type_name = 'trainer' AND u.is_active = 1
                  ORDER BY u.name";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Executar
        $stmt->execute();

        return $stmt;
    }

    // Listar todos os alunos
    public function readAllStudents() {
        // Query
        $query = "SELECT u.id, u.name, u.email, u.phone, u.profile_picture
                  FROM " . $this->table_name . " u
                  JOIN user_types ut ON u.user_type_id = ut.id
                  WHERE ut.type_name = 'student' AND u.is_active = 1
                  ORDER BY u.name";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Executar
        $stmt->execute();

        return $stmt;
    }

    // Listar alunos de um personal
    public function readTrainerStudents() {
        // Query
        $query = "SELECT u.id, u.name, u.email, u.phone, u.profile_picture,
                  st.start_date, st.is_active as relationship_active
                  FROM " . $this->table_name . " u
                  JOIN student_trainer st ON u.id = st.student_id
                  JOIN user_types ut ON u.user_type_id = ut.id
                  WHERE st.trainer_id = :trainer_id AND ut.type_name = 'student'
                  ORDER BY u.name";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Vincular
        $stmt->bindParam(":trainer_id", $this->id);

        // Executar
        $stmt->execute();

        return $stmt;
    }

    // Obter o personal de um aluno
    public function getStudentTrainer() {
        // Query
        $query = "SELECT t.id, t.name, t.email, t.phone, t.profile_picture,
                  st.start_date, st.is_active as relationship_active
                  FROM " . $this->table_name . " t
                  JOIN student_trainer st ON t.id = st.trainer_id
                  JOIN user_types ut ON t.user_type_id = ut.id
                  WHERE st.student_id = :student_id AND ut.type_name = 'trainer'
                  LIMIT 0,1";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Vincular
        $stmt->bindParam(":student_id", $this->id);

        // Executar
        $stmt->execute();

        return $stmt;
    }

    // Atribuir aluno a um personal
    public function assignToTrainer($student_id, $trainer_id) {
        // Verificar se já existe
        $check_query = "SELECT * FROM student_trainer
                       WHERE student_id = :student_id AND trainer_id = :trainer_id";

        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->bindParam(":student_id", $student_id);
        $check_stmt->bindParam(":trainer_id", $trainer_id);
        $check_stmt->execute();

        if($check_stmt->rowCount() > 0) {
            // Atualizar
            $query = "UPDATE student_trainer
                      SET is_active = 1, end_date = NULL, updated_at = NOW()
                      WHERE student_id = :student_id AND trainer_id = :trainer_id";
        } else {
            // Inserir
            $query = "INSERT INTO student_trainer (student_id, trainer_id, start_date)
                      VALUES (:student_id, :trainer_id, NOW())";
        }

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $student_id = htmlspecialchars(strip_tags($student_id));
        $trainer_id = htmlspecialchars(strip_tags($trainer_id));

        // Vincular
        $stmt->bindParam(":student_id", $student_id);
        $stmt->bindParam(":trainer_id", $trainer_id);

        // Executar
        if($stmt->execute()) {
            return true;
        }

        return false;
    }
}
?>
