<?php
require_once '../config/Database.php';

class Workout {
    // Conexão com o banco e tabela
    private $conn;
    private $table_name = "workouts";

    // Propriedades
    public $id;
    public $name;
    public $description;
    public $level;
    public $created_by;
    public $total_distance;
    public $estimated_duration;
    public $is_template;
    public $is_active;
    public $created_at;
    public $updated_at;

    // Construtor
    public function __construct($db) {
        $this->conn = $db;
    }

    // Criar um novo treino
    public function create() {
        // Query para inserir
        $query = "INSERT INTO " . $this->table_name . "
                 (name, description, level, created_by, total_distance,
                 estimated_duration, is_template, is_active)
                 VALUES
                 (:name, :description, :level, :created_by, :total_distance,
                 :estimated_duration, :is_template, :is_active)";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->level = htmlspecialchars(strip_tags($this->level));
        $this->created_by = htmlspecialchars(strip_tags($this->created_by));
        $this->total_distance = htmlspecialchars(strip_tags($this->total_distance));
        $this->estimated_duration = htmlspecialchars(strip_tags($this->estimated_duration));
        $this->is_template = htmlspecialchars(strip_tags($this->is_template));
        $this->is_active = htmlspecialchars(strip_tags($this->is_active ?? 1));

        // Vincular
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":level", $this->level);
        $stmt->bindParam(":created_by", $this->created_by);
        $stmt->bindParam(":total_distance", $this->total_distance);
        $stmt->bindParam(":estimated_duration", $this->estimated_duration);
        $stmt->bindParam(":is_template", $this->is_template);
        $stmt->bindParam(":is_active", $this->is_active);

        // Executar
        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    // Atualizar um treino
    public function update() {
        // Query para atualizar
        $query = "UPDATE " . $this->table_name . "
                 SET name = :name, description = :description, level = :level,
                 total_distance = :total_distance, estimated_duration = :estimated_duration,
                 is_template = :is_template, is_active = :is_active
                 WHERE id = :id";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->id = htmlspecialchars(strip_tags($this->id));
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->level = htmlspecialchars(strip_tags($this->level));
        $this->total_distance = htmlspecialchars(strip_tags($this->total_distance));
        $this->estimated_duration = htmlspecialchars(strip_tags($this->estimated_duration));
        $this->is_template = htmlspecialchars(strip_tags($this->is_template));
        $this->is_active = htmlspecialchars(strip_tags($this->is_active));

        // Vincular
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":level", $this->level);
        $stmt->bindParam(":total_distance", $this->total_distance);
        $stmt->bindParam(":estimated_duration", $this->estimated_duration);
        $stmt->bindParam(":is_template", $this->is_template);
        $stmt->bindParam(":is_active", $this->is_active);

        // Executar
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Obter um treino pelo ID
    public function readOne() {
        // Query
        $query = "SELECT w.*, u.name as creator_name
                 FROM " . $this->table_name . " w
                 LEFT JOIN users u ON w.created_by = u.id
                 WHERE w.id = :id
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
            $this->description = $row['description'];
            $this->level = $row['level'];
            $this->created_by = $row['created_by'];
            $this->creator_name = $row['creator_name'];
            $this->total_distance = $row['total_distance'];
            $this->estimated_duration = $row['estimated_duration'];
            $this->is_template = $row['is_template'];
            $this->is_active = $row['is_active'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];

            return true;
        }

        return false;
    }

    // Listar todos os treinos
    public function readAll() {
        // Query
        $query = "SELECT w.*, u.name as creator_name
                 FROM " . $this->table_name . " w
                 LEFT JOIN users u ON w.created_by = u.id
                 WHERE w.is_active = 1
                 ORDER BY w.created_at DESC";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Executar
        $stmt->execute();

        return $stmt;
    }

    // Listar treinos de um personal
    public function readByTrainer() {
        // Query
        $query = "SELECT w.*, u.name as creator_name
                 FROM " . $this->table_name . " w
                 LEFT JOIN users u ON w.created_by = u.id
                 WHERE w.created_by = :trainer_id AND w.is_active = 1
                 ORDER BY w.created_at DESC";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->created_by = htmlspecialchars(strip_tags($this->created_by));

        // Vincular
        $stmt->bindParam(":trainer_id", $this->created_by);

        // Executar
        $stmt->execute();

        return $stmt;
    }

    // Adicionar uma série ao treino
    public function addSet($workout_id, $exercise_name, $stroke_type_id, $distance, $repetitions, $rest_time, $notes, $order_position) {
        // Query para inserir
        $query = "INSERT INTO workout_sets
                 (workout_id, exercise_name, stroke_type_id, distance, repetitions, rest_time, notes, order_position)
                 VALUES
                 (:workout_id, :exercise_name, :stroke_type_id, :distance, :repetitions, :rest_time, :notes, :order_position)";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $workout_id = htmlspecialchars(strip_tags($workout_id));
        $exercise_name = htmlspecialchars(strip_tags($exercise_name));
        $stroke_type_id = htmlspecialchars(strip_tags($stroke_type_id));
        $distance = htmlspecialchars(strip_tags($distance));
        $repetitions = htmlspecialchars(strip_tags($repetitions));
        $rest_time = htmlspecialchars(strip_tags($rest_time));
        $notes = htmlspecialchars(strip_tags($notes));
        $order_position = htmlspecialchars(strip_tags($order_position));

        // Vincular
        $stmt->bindParam(":workout_id", $workout_id);
        $stmt->bindParam(":exercise_name", $exercise_name);
        $stmt->bindParam(":stroke_type_id", $stroke_type_id);
        $stmt->bindParam(":distance", $distance);
        $stmt->bindParam(":repetitions", $repetitions);
        $stmt->bindParam(":rest_time", $rest_time);
        $stmt->bindParam(":notes", $notes);
        $stmt->bindParam(":order_position", $order_position);

        // Executar
        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    // Obter séries de um treino
    public function getWorkoutSets() {
        // Query
        $query = "SELECT ws.*, st.name as stroke_name
                 FROM workout_sets ws
                 LEFT JOIN stroke_types st ON ws.stroke_type_id = st.id
                 WHERE ws.workout_id = :workout_id
                 ORDER BY ws.order_position";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Vincular
        $stmt->bindParam(":workout_id", $this->id);

        // Executar
        $stmt->execute();

        return $stmt;
    }

    // Atribuir treino a um aluno
    public function assignToStudent($workout_id, $student_id, $trainer_id, $due_date = null) {
        // Query para inserir
        $query = "INSERT INTO assigned_workouts
                 (workout_id, user_id, assigned_by, assigned_date, due_date)
                 VALUES
                 (:workout_id, :student_id, :trainer_id, NOW(), :due_date)";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $workout_id = htmlspecialchars(strip_tags($workout_id));
        $student_id = htmlspecialchars(strip_tags($student_id));
        $trainer_id = htmlspecialchars(strip_tags($trainer_id));
        if($due_date) {
            $due_date = htmlspecialchars(strip_tags($due_date));
        }

        // Vincular
        $stmt->bindParam(":workout_id", $workout_id);
        $stmt->bindParam(":student_id", $student_id);
        $stmt->bindParam(":trainer_id", $trainer_id);
        $stmt->bindParam(":due_date", $due_date);

        // Executar
        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    // Listar treinos atribuídos a um aluno
    public function getAssignedWorkouts($student_id) {
        // Query
        $query = "SELECT aw.*, w.name, w.description, w.level, w.total_distance,
                 w.estimated_duration, u.name as trainer_name
                 FROM assigned_workouts aw
                 JOIN " . $this->table_name . " w ON aw.workout_id = w.id
                 JOIN users u ON aw.assigned_by = u.id
                 WHERE aw.user_id = :student_id
                 ORDER BY aw.assigned_date DESC";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $student_id = htmlspecialchars(strip_tags($student_id));

        // Vincular
        $stmt->bindParam(":student_id", $student_id);

        // Executar
        $stmt->execute();

        return $stmt;
    }

    // Iniciar uma sessão de treino
    public function startWorkoutSession($assigned_workout_id) {
        // Query para inserir
        $query = "INSERT INTO workout_sessions
                 (assigned_workout_id, start_time, status)
                 VALUES
                 (:assigned_workout_id, NOW(), 'em_andamento')";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $assigned_workout_id = htmlspecialchars(strip_tags($assigned_workout_id));

        // Vincular
        $stmt->bindParam(":assigned_workout_id", $assigned_workout_id);

        // Executar
        if($stmt->execute()) {
            // Atualizar status do treino atribuído
            $update_query = "UPDATE assigned_workouts
                           SET status = 'em_andamento', progress = 0
                           WHERE id = :assigned_workout_id";

            $update_stmt = $this->conn->prepare($update_query);
            $update_stmt->bindParam(":assigned_workout_id", $assigned_workout_id);
            $update_stmt->execute();

            return $this->conn->lastInsertId();
        }

        return false;
    }

    // Finalizar uma sessão de treino
    public function finishWorkoutSession($session_id, $total_time, $total_distance, $notes = null) {
        // Query para atualizar
        $query = "UPDATE workout_sessions
                 SET end_time = NOW(), status = 'concluido',
                 total_time = :total_time, total_distance = :total_distance,
                 notes = :notes
                 WHERE id = :session_id";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $session_id = htmlspecialchars(strip_tags($session_id));
        $total_time = htmlspecialchars(strip_tags($total_time));
        $total_distance = htmlspecialchars(strip_tags($total_distance));
        if($notes) {
            $notes = htmlspecialchars(strip_tags($notes));
        }

        // Vincular
        $stmt->bindParam(":session_id", $session_id);
        $stmt->bindParam(":total_time", $total_time);
        $stmt->bindParam(":total_distance", $total_distance);
        $stmt->bindParam(":notes", $notes);

        // Executar
        if($stmt->execute()) {
            // Obter o assigned_workout_id
            $get_query = "SELECT assigned_workout_id FROM workout_sessions WHERE id = :session_id";
            $get_stmt = $this->conn->prepare($get_query);
            $get_stmt->bindParam(":session_id", $session_id);
            $get_stmt->execute();
            $row = $get_stmt->fetch(PDO::FETCH_ASSOC);
            $assigned_workout_id = $row['assigned_workout_id'];

            // Atualizar status do treino atribuído
            $update_query = "UPDATE assigned_workouts
                           SET status = 'concluido', progress = 100
                           WHERE id = :assigned_workout_id";

            $update_stmt = $this->conn->prepare($update_query);
            $update_stmt->bindParam(":assigned_workout_id", $assigned_workout_id);
            $update_stmt->execute();

            return true;
        }

        return false;
    }

    // Registrar uma volta
    public function recordLap($set_execution_id, $repetition_number, $lap_time) {
        // Calcular o pace (em segundos por 100m)
        $get_distance_query = "SELECT ws.distance
                             FROM set_executions se
                             JOIN workout_sets ws ON se.workout_set_id = ws.id
                             WHERE se.id = :set_execution_id";

        $get_distance_stmt = $this->conn->prepare($get_distance_query);
        $get_distance_stmt->bindParam(":set_execution_id", $set_execution_id);
        $get_distance_stmt->execute();
        $row = $get_distance_stmt->fetch(PDO::FETCH_ASSOC);
        $distance = $row['distance'];

        // Calcular pace (tempo por 100m)
        $pace_seconds = ($lap_time / $distance) * 100;
        $pace = gmdate("i:s", $pace_seconds);

        // Query para inserir
        $query = "INSERT INTO laps
                 (set_execution_id, repetition_number, lap_time, pace, created_at)
                 VALUES
                 (:set_execution_id, :repetition_number, :lap_time, :pace, NOW())";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $set_execution_id = htmlspecialchars(strip_tags($set_execution_id));
        $repetition_number = htmlspecialchars(strip_tags($repetition_number));
        $lap_time = htmlspecialchars(strip_tags($lap_time));

        // Vincular
        $stmt->bindParam(":set_execution_id", $set_execution_id);
        $stmt->bindParam(":repetition_number", $repetition_number);
        $stmt->bindParam(":lap_time", $lap_time);
        $stmt->bindParam(":pace", $pace);

        // Executar
        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }
}
?>
