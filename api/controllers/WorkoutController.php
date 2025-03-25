<?php
require_once __DIR__ . '../models/Workout.php';
require_once __DIR__ . '../models/User.php';
require_once __DIR__ . '../helpers/ApiResponse.php';

class WorkoutController {
    private $workout;
    private $user;
    private $db;

    public function __construct($db) {
        $this->db = $db;
        $this->workout = new Workout($db);
        $this->user = new User($db);
    }

    // Verificar autenticação
    private function authenticate() {
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? '';

        if(empty($token)) {
            return false;
        }

        $token = str_replace("Bearer ", "", $token);
        return $this->user->validateToken($token);
    }

    // Criar um novo treino
    public function createWorkout() {
        // Verificar autenticação
        $user_data = $this->authenticate();

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar tipo de usuário
        if($user_data['type_name'] != 'admin' && $user_data['type_name'] != 'trainer') {
            return ApiResponse::unauthorized("Acesso não autorizado");
        }

        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->name) || !isset($data->level) || !isset($data->total_distance) || !isset($data->estimated_duration)) {
            return ApiResponse::error("Dados incompletos para criação do treino");
        }

        // Configurar dados para criação
        $this->workout->name = $data->name;
        $this->workout->description = $data->description ?? '';
        $this->workout->level = $data->level;
        $this->workout->created_by = $user_data['id'];
        $this->workout->total_distance = $data->total_distance;
        $this->workout->estimated_duration = $data->estimated_duration;
        $this->workout->is_template = $data->is_template ?? 0;
        $this->workout->is_active = 1;

        // Tentar criar treino
        $workout_id = $this->workout->create();

        if($workout_id) {
            // Adicionar séries ao treino, se fornecidas
            if(isset($data->sets) && is_array($data->sets)) {
                foreach($data->sets as $index => $set) {
                    $this->workout->addSet(
                        $workout_id,
                        $set->exercise_name,
                        $set->stroke_type_id,
                        $set->distance,
                        $set->repetitions,
                        $set->rest_time,
                        $set->notes ?? '',
                        $index + 1
                    );
                }
            }

            return ApiResponse::success("Treino criado com sucesso", ["id" => $workout_id], 201);
        } else {
            return ApiResponse::serverError("Erro ao criar treino");
        }
    }

    // Atualizar um treino
    public function updateWorkout() {
        // Verificar autenticação
        $user_data = $this->authenticate();

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar tipo de usuário
        if($user_data['type_name'] != 'admin' && $user_data['type_name'] != 'trainer') {
            return ApiResponse::unauthorized("Acesso não autorizado");
        }

        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->id)) {
            return ApiResponse::error("ID do treino é obrigatório");
        }

        // Verificar se o treino existe e se o usuário tem permissão
        $this->workout->id = $data->id;
        if(!$this->workout->readOne()) {
            return ApiResponse::notFound("Treino não encontrado");
        }

        // Para personais, verificar se o treino foi criado por eles
        if($user_data['type_name'] == 'trainer' && $this->workout->created_by != $user_data['id']) {
            return ApiResponse::unauthorized("Você só pode editar treinos criados por você");
        }

        // Configurar dados para atualização
        $this->workout->name = $data->name ?? $this->workout->name;
        $this->workout->description = $data->description ?? $this->workout->description;
        $this->workout->level = $data->level ?? $this->workout->level;
        $this->workout->total_distance = $data->total_distance ?? $this->workout->total_distance;
        $this->workout->estimated_duration = $data->estimated_duration ?? $this->workout->estimated_duration;
        $this->workout->is_template = $data->is_template ?? $this->workout->is_template;
        $this->workout->is_active = $data->is_active ?? $this->workout->is_active;

        // Tentar atualizar treino
        if($this->workout->update()) {
            return ApiResponse::success("Treino atualizado com sucesso");
        } else {
            return ApiResponse::serverError("Erro ao atualizar treino");
        }
    }

    // Obter detalhes de um treino
    public function getWorkout() {
        // Verificar autenticação
        $user_data = $this->authenticate();

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar se o ID foi fornecido
        $id = isset($_GET['id']) ? $_GET['id'] : null;

        if(!$id) {
            return ApiResponse::error("ID do treino é obrigatório");
        }

        // Obter treino
        $this->workout->id = $id;
        if($this->workout->readOne()) {
            // Obter séries do treino
            $stmt = $this->workout->getWorkoutSets();
            $sets = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Montar resposta
            $workout_data = [
                "id" => $this->workout->id,
                "name" => $this->workout->name,
                "description" => $this->workout->description,
                "level" => $this->workout->level,
                "created_by" => $this->workout->created_by,
                "creator_name" => $this->workout->creator_name,
                "total_distance" => $this->workout->total_distance,
                "estimated_duration" => $this->workout->estimated_duration,
                "is_template" => $this->workout->is_template,
                "is_active" => $this->workout->is_active,
                "created_at" => $this->workout->created_at,
                "updated_at" => $this->workout->updated_at,
                "sets" => $sets
            ];

            return ApiResponse::success("Treino obtido com sucesso", $workout_data);
        } else {
            return ApiResponse::notFound("Treino não encontrado");
        }
    }

    // Listar todos os treinos
    public function listWorkouts() {
        // Verificar autenticação
        $user_data = $this->authenticate();

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar tipo de usuário
        if($user_data['type_name'] == 'trainer') {
            // Listar treinos do personal
            $this->workout->created_by = $user_data['id'];
            $stmt = $this->workout->readByTrainer();
        } else {
            // Listar todos os treinos
            $stmt = $this->workout->readAll();
        }

        $workouts = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $workouts[] = $row;
        }

        return ApiResponse::success("Treinos obtidos com sucesso", $workouts);
    }

    // Atribuir treino a um aluno
    public function assignWorkout() {
        // Verificar autenticação
        $user_data = $this->authenticate();

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar tipo de usuário
        if($user_data['type_name'] != 'admin' && $user_data['type_name'] != 'trainer') {
            return ApiResponse::unauthorized("Acesso não autorizado");
        }

        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->workout_id) || !isset($data->student_id)) {
            return ApiResponse::error("ID do treino e ID do aluno são obrigatórios");
        }

        // Para personais, verificar se o aluno está atribuído a eles
        if($user_data['type_name'] == 'trainer') {
            $this->user->id = $user_data['id'];
            $stmt = $this->user->readTrainerStudents();
            $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $student_found = false;
            foreach($students as $student) {
                if($student['id'] == $data->student_id) {
                    $student_found = true;
                    break;
                }
            }

            if(!$student_found) {
                return ApiResponse::unauthorized("Você só pode atribuir treinos aos seus alunos");
            }
        }

        // Atribuir treino ao aluno
        $assigned_id = $this->workout->assignToStudent(
            $data->workout_id,
            $data->student_id,
            $user_data['id'],
            $data->due_date ?? null
        );

        if($assigned_id) {
            return ApiResponse::success("Treino atribuído com sucesso", ["id" => $assigned_id]);
        } else {
            return ApiResponse::serverError("Erro ao atribuir treino");
        }
    }

    // Listar treinos atribuídos a um aluno
    public function listAssignedWorkouts() {
        // Verificar autenticação
        $user_data = $this->authenticate();

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Determinar o ID do aluno
        $student_id = isset($_GET['student_id']) ? $_GET['student_id'] : null;

        // Se for aluno, usar o próprio ID
        if($user_data['type_name'] == 'student') {
            $student_id = $user_data['id'];
        }
        // Se for personal, verificar se o aluno está atribuído a ele
        else if($user_data['type_name'] == 'trainer' && $student_id) {
            $this->user->id = $user_data['id'];
            $stmt = $this->user->readTrainerStudents();
            $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $student_found = false;
            foreach($students as $student) {
                if($student['id'] == $student_id) {
                    $student_found = true;
                    break;
                }
            }

            if(!$student_found) {
                return ApiResponse::unauthorized("Você só pode ver treinos dos seus alunos");
            }
        }
        // Se for admin sem ID específico, erro
        else if(!$student_id) {
            return ApiResponse::error("ID do aluno é obrigatório");
        }

        // Obter treinos atribuídos
        $stmt = $this->workout->getAssignedWorkouts($student_id);
        $workouts = [];

        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $workouts[] = $row;
        }

        return ApiResponse::success("Treinos atribuídos obtidos com sucesso", $workouts);
    }

    // Iniciar uma sessão de treino
    public function startWorkoutSession() {
        // Verificar autenticação
        $user_data = $this->authenticate();

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar tipo de usuário
        if($user_data['type_name'] != 'student') {
            return ApiResponse::unauthorized("Apenas alunos podem iniciar sessões de treino");
        }

        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->assigned_workout_id)) {
            return ApiResponse::error("ID do treino atribuído é obrigatório");
        }

        // Verificar se o treino pertence ao aluno
        $stmt = $this->workout->getAssignedWorkouts($user_data['id']);
        $workouts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $workout_found = false;
        foreach($workouts as $workout) {
            if($workout['id'] == $data->assigned_workout_id) {
                $workout_found = true;
                break;
            }
        }

        if(!$workout_found) {
            return ApiResponse::unauthorized("Este treino não está atribuído a você");
        }

        // Iniciar sessão de treino
        $session_id = $this->workout->startWorkoutSession($data->assigned_workout_id);

        if($session_id) {
            return ApiResponse::success("Sessão de treino iniciada com sucesso", ["session_id" => $session_id]);
        } else {
            return ApiResponse::serverError("Erro ao iniciar sessão de treino");
        }
    }

    // Finalizar uma sessão de treino
    public function finishWorkoutSession() {
        // Verificar autenticação
        $user_data = $this->authenticate();

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar tipo de usuário
        if($user_data['type_name'] != 'student') {
            return ApiResponse::unauthorized("Apenas alunos podem finalizar sessões de treino");
        }

        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->session_id) || !isset($data->total_time) || !isset($data->total_distance)) {
            return ApiResponse::error("Dados incompletos para finalizar a sessão");
        }

        // Finalizar sessão de treino
        if($this->workout->finishWorkoutSession(
            $data->session_id,
            $data->total_time,
            $data->total_distance,
            $data->notes ?? null
        )) {
            return ApiResponse::success("Sessão de treino finalizada com sucesso");
        } else {
            return ApiResponse::serverError("Erro ao finalizar sessão de treino");
        }
    }

    // Registrar uma volta
    public function recordLap() {
        // Verificar autenticação
        $user_data = $this->authenticate();

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar tipo de usuário
        if($user_data['type_name'] != 'student') {
            return ApiResponse::unauthorized("Apenas alunos podem registrar voltas");
        }

        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->set_execution_id) || !isset($data->repetition_number) || !isset($data->lap_time)) {
            return ApiResponse::error("Dados incompletos para registrar a volta");
        }

        // Registrar volta
        $lap_id = $this->workout->recordLap(
            $data->set_execution_id,
            $data->repetition_number,
            $data->lap_time
        );

        if($lap_id) {
            return ApiResponse::success("Volta registrada com sucesso", ["id" => $lap_id]);
        } else {
            return ApiResponse::serverError("Erro ao registrar volta");
        }
    }
}
?>
