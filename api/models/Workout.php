<?php
require_once __DIR__ . '/../config/Database.php';

class Workout {
    // Conexão com o banco e tabela
    private $conn;
    private $table_name = "workouts";

    // Propriedades do treino
    public $id;
    public $user_id;
    public $name;
    public $type;
    public $notes;
    public $duration;
    public $durationUnit;
    public $validate_to;
    public $created_at;

    // Construtor
    public function __construct($db) {
        $this->conn = $db;
    }

    // Criar um novo treino
    public function create() {
        // Calcular a data de validade (validate_to) baseada na duração
        $validate_to = null;
        if ($this->duration && $this->durationUnit) {
            $validate_to = $this->calculateValidateToDate($this->duration, $this->durationUnit);
        }

        // Query para inserir
        $query = "INSERT INTO " . $this->table_name . "
                 (user_id, name, type, notes, duration, duration_unit, validate_to)
                 VALUES
                 (:user_id, :name, :type, :notes, :duration, :duration_unit, :validate_to)";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->type = htmlspecialchars(strip_tags($this->type));
        $this->notes = htmlspecialchars(strip_tags($this->notes));
        $this->duration = $this->duration ? htmlspecialchars(strip_tags($this->duration)) : null;
        $this->durationUnit = $this->durationUnit ? htmlspecialchars(strip_tags($this->durationUnit)) : null;

        // Vincular
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":type", $this->type);
        $stmt->bindParam(":notes", $this->notes);
        $stmt->bindParam(":duration", $this->duration);
        $stmt->bindParam(":duration_unit", $this->durationUnit);
        $stmt->bindParam(":validate_to", $validate_to);

        // Executar
        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    // Método auxiliar para calcular a data de validade
    private function calculateValidateToDate($duration, $durationUnit) {
        $today = new \DateTime();

        switch ($durationUnit) {
            case 'dias':
                $today->add(new \DateInterval("P{$duration}D"));
                break;
            case 'semanas':
                $today->add(new \DateInterval("P{$duration}W"));
                break;
            case 'meses':
                $today->add(new \DateInterval("P{$duration}M"));
                break;
            default:
                // Padrão: adicionar dias
                $today->add(new \DateInterval("P{$duration}D"));
        }

        // Definir o horário para 23:59:59
        $today->setTime(23, 59, 59);

        return $today->format('Y-m-d H:i:s');
    }

    // Atualizar um treino
    public function update() {
        // Calcular a data de validade (validate_to) baseada na duração, se fornecida
        $validate_to = null;
        if ($this->duration && $this->durationUnit) {
            $validate_to = $this->calculateValidateToDate($this->duration, $this->durationUnit);
        }

        // Query para atualizar
        $query = "UPDATE " . $this->table_name . "
                 SET user_id = :user_id, name = :name, type = :type, notes = :notes,
                 duration = :duration, duration_unit = :duration_unit, validate_to = :validate_to
                 WHERE id = :id";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->id = htmlspecialchars(strip_tags($this->id));
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->type = htmlspecialchars(strip_tags($this->type));
        $this->notes = htmlspecialchars(strip_tags($this->notes));
        $this->duration = $this->duration ? htmlspecialchars(strip_tags($this->duration)) : null;
        $this->durationUnit = $this->durationUnit ? htmlspecialchars(strip_tags($this->durationUnit)) : null;

        // Vincular
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":type", $this->type);
        $stmt->bindParam(":notes", $this->notes);
        $stmt->bindParam(":duration", $this->duration);
        $stmt->bindParam(":duration_unit", $this->durationUnit);
        $stmt->bindParam(":validate_to", $validate_to);

        // Executar
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Obter um treino pelo ID
    public function readOne() {
        // Query
        $query = "SELECT w.*, u.name as student_name
                 FROM " . $this->table_name . " w
                 LEFT JOIN users u ON w.user_id = u.id
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
            $this->user_id = $row['user_id'];
            $this->name = $row['name'];
            $this->type = $row['type'];
            $this->notes = $row['notes'];
            $this->created_at = $row['created_at'];
            $this->student_name = $row['student_name'];

            return true;
        }

        return false;
    }

    // Listar todos os treinos
    public function readAll($situation = null) {
        // Query base
        $query = "SELECT w.*, u.name as student_name
                 FROM " . $this->table_name . " w
                 LEFT JOIN users u ON w.user_id = u.id
                 WHERE 1=1";

        // Adicionar filtro de situação se fornecido
        if ($situation) {
            $query .= " AND w.situation = :situation";
        }

        // Ordenação
        $query .= " ORDER BY w.created_at DESC";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Vincular parâmetros se necessário
        if ($situation) {
            $situation = htmlspecialchars(strip_tags($situation));
            $stmt->bindParam(":situation", $situation);
        }

        // Executar
        $stmt->execute();

        return $stmt;
    }

    // Listar treinos de um aluno
    public function readByUserId($user_id, $situation = null) {
        // Query base
        $query = "SELECT w.*, u.name as student_name
                 FROM " . $this->table_name . " w
                 LEFT JOIN users u ON w.user_id = u.id
                 WHERE w.user_id = :user_id";

        // Adicionar filtro de situação se fornecido
        if ($situation) {
            $query .= " AND w.situation = :situation";
        }

        // Ordenação
        $query .= " ORDER BY w.created_at DESC";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $user_id = htmlspecialchars(strip_tags($user_id));

        // Vincular parâmetros
        $stmt->bindParam(":user_id", $user_id);

        // Vincular situação se fornecida
        if ($situation) {
            $situation = htmlspecialchars(strip_tags($situation));
            $stmt->bindParam(":situation", $situation);
        }

        // Executar
        $stmt->execute();

        return $stmt;
    }

    // Adicionar um exercício ao treino
    public function addExercise($workout_id, $exercise_id, $sets, $reps, $rest_seconds, $duration_seconds, $order_index) {
        // Query para inserir
        $query = "INSERT INTO workout_sets
                 (workout_id, exercise_id, sets, reps, rest_seconds, duration_seconds, order_index)
                 VALUES
                 (:workout_id, :exercise_id, :sets, :reps, :rest_seconds, :duration_seconds, :order_index)";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $workout_id = htmlspecialchars(strip_tags($workout_id));
        $exercise_id = htmlspecialchars(strip_tags($exercise_id));
        $sets = htmlspecialchars(strip_tags($sets));
        $reps = htmlspecialchars(strip_tags($reps));
        $rest_seconds = htmlspecialchars(strip_tags($rest_seconds));
        $duration_seconds = $duration_seconds ? htmlspecialchars(strip_tags($duration_seconds)) : null;
        $order_index = htmlspecialchars(strip_tags($order_index));

        // Vincular
        $stmt->bindParam(":workout_id", $workout_id);
        $stmt->bindParam(":exercise_id", $exercise_id);
        $stmt->bindParam(":sets", $sets);
        $stmt->bindParam(":reps", $reps);
        $stmt->bindParam(":rest_seconds", $rest_seconds);
        $stmt->bindParam(":duration_seconds", $duration_seconds);
        $stmt->bindParam(":order_index", $order_index);

        // Executar
        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    // Obter exercícios de um treino
    public function getWorkoutExercises() {
        // Query
        $query = "SELECT ws.*, e.name as exercise_name, e.category, e.description,
                 e.muscles, e.instructions, e.image_path, e.video_path
                 FROM workout_sets ws
                 JOIN exercises e ON ws.exercise_id = e.id
                 WHERE ws.workout_id = :workout_id
                 ORDER BY ws.order_index";

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

    // Remover um exercício do treino
    public function removeExercise($workout_set_id) {
        // Query para excluir
        $query = "DELETE FROM workout_sets WHERE id = :id";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $workout_set_id = htmlspecialchars(strip_tags($workout_set_id));

        // Vincular
        $stmt->bindParam(":id", $workout_set_id);

        // Executar
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Atualizar um exercício do treino
    public function updateExercise($workout_set_id, $sets, $reps, $rest_seconds, $duration_seconds, $order_index) {
        // Query para atualizar
        $query = "UPDATE workout_sets
                 SET sets = :sets, reps = :reps, rest_seconds = :rest_seconds,
                 duration_seconds = :duration_seconds, order_index = :order_index
                 WHERE id = :id";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $workout_set_id = htmlspecialchars(strip_tags($workout_set_id));
        $sets = htmlspecialchars(strip_tags($sets));
        $reps = htmlspecialchars(strip_tags($reps));
        $rest_seconds = htmlspecialchars(strip_tags($rest_seconds));
        $duration_seconds = $duration_seconds ? htmlspecialchars(strip_tags($duration_seconds)) : null;
        $order_index = htmlspecialchars(strip_tags($order_index));

        // Vincular
        $stmt->bindParam(":id", $workout_set_id);
        $stmt->bindParam(":sets", $sets);
        $stmt->bindParam(":reps", $reps);
        $stmt->bindParam(":rest_seconds", $rest_seconds);
        $stmt->bindParam(":duration_seconds", $duration_seconds);
        $stmt->bindParam(":order_index", $order_index);

        // Executar
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Excluir um treino
    public function delete() {
        // Primeiro excluir todos os exercícios do treino
        $delete_sets_query = "DELETE FROM workout_sets WHERE workout_id = :workout_id";
        $delete_sets_stmt = $this->conn->prepare($delete_sets_query);
        $delete_sets_stmt->bindParam(":workout_id", $this->id);
        $delete_sets_stmt->execute();

        // Depois excluir o treino
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Vincular
        $stmt->bindParam(":id", $this->id);

        // Executar
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Finalizar uma sessão de treino
    public function finishWorkoutSession($session_id, $total_time, $total_distance, $notes = '') {
        // Query para atualizar a sessão
        $query = "UPDATE workout_sessions
                 SET end_time = NOW(),
                     total_time = :total_time,
                     total_distance = :total_distance,
                     notes = :notes,
                     status = 'concluido'
                 WHERE id = :session_id";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $session_id = htmlspecialchars(strip_tags($session_id));
        $total_time = htmlspecialchars(strip_tags($total_time));
        $total_distance = htmlspecialchars(strip_tags($total_distance));
        $notes = htmlspecialchars(strip_tags($notes));

        // Vincular
        $stmt->bindParam(":session_id", $session_id);
        $stmt->bindParam(":total_time", $total_time);
        $stmt->bindParam(":total_distance", $total_distance);
        $stmt->bindParam(":notes", $notes);

        // Executar
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Atribuir um treino a um aluno
    public function assignWorkout($workout_id, $student_id, $scheduled_date = null, $notes = '') {
        // Query para inserir
        $query = "INSERT INTO assigned_workouts
                 (workout_id, student_id, scheduled_date, notes, status)
                 VALUES
                 (:workout_id, :student_id, :scheduled_date, :notes, 'pendente')";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $workout_id = htmlspecialchars(strip_tags($workout_id));
        $student_id = htmlspecialchars(strip_tags($student_id));
        $notes = htmlspecialchars(strip_tags($notes));

        // Formatar a data agendada se fornecida
        if ($scheduled_date) {
            $scheduled_date = htmlspecialchars(strip_tags($scheduled_date));
        } else {
            $scheduled_date = null;
        }

        // Vincular
        $stmt->bindParam(":workout_id", $workout_id);
        $stmt->bindParam(":student_id", $student_id);
        $stmt->bindParam(":scheduled_date", $scheduled_date);
        $stmt->bindParam(":notes", $notes);

        // Executar
        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    // Obter treinos atribuídos com base em filtros
    public function getAssignedWorkouts($student_id = null, $trainer_id = null, $status = null) {
        // Query base
        $query = "SELECT aw.*, w.name as workout_name, w.type as workout_type,
                 s.name as student_name, t.name as trainer_name
                 FROM assigned_workouts aw
                 JOIN " . $this->table_name . " w ON aw.workout_id = w.id
                 JOIN users s ON aw.student_id = s.id
                 JOIN users t ON w.user_id = t.id
                 WHERE 1=1";

        // Adicionar filtros à query se fornecidos
        $params = [];

        if ($student_id) {
            $query .= " AND aw.student_id = :student_id";
            $params[':student_id'] = $student_id;
        }

        if ($trainer_id) {
            $query .= " AND w.user_id = :trainer_id";
            $params[':trainer_id'] = $trainer_id;
        }

        if ($status) {
            $query .= " AND aw.status = :status";
            $params[':status'] = $status;
        }

        // Ordenar por data agendada e data de criação
        $query .= " ORDER BY aw.due_date ASC, aw.created_at DESC";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Vincular parâmetros
        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }

        // Executar
        $stmt->execute();

        return $stmt;
    }

    // Iniciar uma sessão de treino
    public function startWorkoutSession($assigned_workout_id, $user_id) {
        // Primeiro, obter as informações do treino atribuído
        $query_aw = "SELECT aw.*, w.id as workout_id, w.name, w.type
                    FROM assigned_workouts aw
                    JOIN " . $this->table_name . " w ON aw.workout_id = w.id
                    WHERE aw.id = :assigned_workout_id
                    LIMIT 1";

        $stmt_aw = $this->conn->prepare($query_aw);
        $stmt_aw->bindParam(":assigned_workout_id", $assigned_workout_id);
        $stmt_aw->execute();

        if ($stmt_aw->rowCount() == 0) {
            return false; // Treino atribuído não encontrado
        }

        $assigned_workout = $stmt_aw->fetch(PDO::FETCH_ASSOC);

        // Verificar se o usuário é o aluno atribuído
        if ($assigned_workout['student_id'] != $user_id) {
            // Verificar se é um personal verificando o workout_id
            $this->id = $assigned_workout['workout_id'];
            if (!$this->readOne() || $this->user_id != $user_id) {
                return false; // Usuário não autorizado
            }
        }

        // Criar uma nova sessão de treino
        $query = "INSERT INTO workout_sessions
                 (assigned_workout_id, start_time, status)
                 VALUES
                 (:assigned_workout_id, NOW(), 'em_andamento')";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":assigned_workout_id", $assigned_workout_id);

        if ($stmt->execute()) {
            $session_id = $this->conn->lastInsertId();

            // Atualizar o status do treino atribuído para 'em_andamento'
            $update_query = "UPDATE assigned_workouts
                           SET status = 'em_andamento'
                           WHERE id = :id";

            $update_stmt = $this->conn->prepare($update_query);
            $update_stmt->bindParam(":id", $assigned_workout_id);
            $update_stmt->execute();

            // Criar execuções de sets para cada exercício do treino
            $this->id = $assigned_workout['workout_id'];
            $stmt_exercises = $this->getWorkoutExercises();
            $exercises = $stmt_exercises->fetchAll(PDO::FETCH_ASSOC);

            foreach ($exercises as $exercise) {
                $set_query = "INSERT INTO sets_executions
                             (workout_session_id, workout_set_id)
                             VALUES
                             (:workout_session_id, :workout_set_id)";

                $set_stmt = $this->conn->prepare($set_query);
                $set_stmt->bindParam(":workout_session_id", $session_id);
                $set_stmt->bindParam(":workout_set_id", $exercise['id']);
                $set_stmt->execute();
            }

            return $session_id;
        }

        return false;
    }

    // Registrar uma volta (lap) de um exercício
    public function recordLap($set_execution_id, $repetition_number, $lap_time) {
        // Query para inserir
        $query = "INSERT INTO laps
                 (set_execution_id, repetition_number, lap_time)
                 VALUES
                 (:set_execution_id, :repetition_number, :lap_time)";

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

        // Executar
        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    // Obter detalhes de uma sessão de treino
    public function getWorkoutSession($session_id) {
        // Query principal para obter a sessão
        $query = "SELECT ws.*, aw.workout_id, aw.student_id, aw.notes as assigned_notes,
                 w.name as workout_name, w.type as workout_type, u.name as student_name
                 FROM workout_sessions ws
                 JOIN assigned_workouts aw ON ws.assigned_workout_id = aw.id
                 JOIN " . $this->table_name . " w ON aw.workout_id = w.id
                 JOIN users u ON aw.student_id = u.id
                 WHERE ws.id = :session_id
                 LIMIT 1";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $session_id = htmlspecialchars(strip_tags($session_id));

        // Vincular
        $stmt->bindParam(":session_id", $session_id);

        // Executar
        $stmt->execute();

        if($stmt->rowCount() == 0) {
            return false;
        }

        $session = $stmt->fetch(PDO::FETCH_ASSOC);

        // Obter as execuções de sets
        $sets_query = "SELECT se.*, ws.exercise_id, ws.sets, ws.reps,
                     ws.rest_seconds, ws.duration_seconds, ws.order_index,
                     e.name as exercise_name, e.category, e.description
                     FROM sets_executions se
                     JOIN workout_sets ws ON se.workout_set_id = ws.id
                     JOIN exercises e ON ws.exercise_id = e.id
                     WHERE se.workout_session_id = :session_id
                     ORDER BY ws.order_index";

        $sets_stmt = $this->conn->prepare($sets_query);
        $sets_stmt->bindParam(":session_id", $session_id);
        $sets_stmt->execute();

        $sets = [];
        while($set_row = $sets_stmt->fetch(PDO::FETCH_ASSOC)) {
            // Obter voltas para cada execução de set
            $laps_query = "SELECT l.*
                         FROM laps l
                         WHERE l.set_execution_id = :set_execution_id
                         ORDER BY l.repetition_number";

            $laps_stmt = $this->conn->prepare($laps_query);
            $laps_stmt->bindParam(":set_execution_id", $set_row['id']);
            $laps_stmt->execute();

            $laps = [];
            while($lap_row = $laps_stmt->fetch(PDO::FETCH_ASSOC)) {
                $laps[] = $lap_row;
            }

            $set_row['laps'] = $laps;
            $sets[] = $set_row;
        }

        $session['sets'] = $sets;

        return $session;
    }

    // Buscar o treino ativo de um usuário
    public function getActiveWorkout($type) {
        // Query para obter o treino com situation='ativo' para o usuário
        $query = "SELECT * FROM " . $this->table_name . "
                 WHERE situation = 'ativo' AND type = :type
                 LIMIT 0,1";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Vincular
        $stmt->bindParam(":type", $type);


        // Executar
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    public function getSetsWorkout($workoutId) {
        $query = "SELECT * FROM workout_sets WHERE workout_id = :workout_id ORDER BY order_index ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":workout_id", $workoutId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
