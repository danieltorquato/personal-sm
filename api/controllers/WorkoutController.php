<?php
require_once __DIR__ . '/../models/Workout.php';
require_once __DIR__ . '/../models/Exercise.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../helpers/ApiResponse.php';
require_once __DIR__ . '/../helpers/AuthHelper.php';

class WorkoutController {
    private $workout;
    private $exercise;
    private $user;
    private $db;
    private $authHelper;
    public function __construct($db) {
        $this->db = $db;
        $this->workout = new Workout($db);
        $this->exercise = new Exercise($db);
        $this->authHelper = new AuthHelper();
        $this->user = new User();
    }

    // Criar um novo treino
    public function createWorkout() {

        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->user_id) || !isset($data->name) || !isset($data->type)) {
            return ApiResponse::error("Dados incompletos para criação do treino");
        }

        // Configurar dados para criação
        $this->workout->user_id = $data->user_id;
        $this->workout->name = $data->name;
        $this->workout->type = $data->type;
        $this->workout->notes = $data->notes ?? '';

        // Adicionar dados de duração
        $this->workout->duration = $data->duration ?? null;
        $this->workout->durationUnit = $data->durationUnit ?? null;

        // Tentar criar treino
        $workout_id = $this->workout->create();

        if($workout_id) {
            // Adicionar exercícios ao treino, se fornecidos
            if(isset($data->exercises) && is_array($data->exercises)) {
                foreach($data->exercises as $index => $exercise) {
                    $this->workout->addExercise(
                        $workout_id,
                        $exercise->exercise_id,
                        $exercise->sets ?? 1,
                        $exercise->reps ?? 10,
                        $exercise->rest_seconds ?? 60,
                        $exercise->duration_seconds ?? null,
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
        $user_data = $this->authHelper->getUserFromToken();

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

        // Verificar se o treino existe
        $this->workout->id = $data->id;
        if(!$this->workout->readOne()) {
            return ApiResponse::notFound("Treino não encontrado");
        }

        // Configurar dados para atualização
        $this->workout->user_id = $data->user_id ?? $this->workout->user_id;
        $this->workout->name = $data->name ?? $this->workout->name;
        $this->workout->type = $data->type ?? $this->workout->type;
        $this->workout->notes = $data->notes ?? $this->workout->notes;

        // Atualizar dados de duração
        $this->workout->duration = $data->duration ?? $this->workout->duration;
        $this->workout->durationUnit = $data->durationUnit ?? $this->workout->durationUnit;

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

        // Obter ID do treino da URL
        $id = isset($_GET['id']) ? $_GET['id'] : null;

        if(!$id) {
            return ApiResponse::error("ID do treino não fornecido");
        }

        // Obter treino
        $this->workout->id = $id;
        if($this->workout->readOne()) {
            // Obter exercícios do treino
            $stmt = $this->workout->getWorkoutExercises();
            $exercises = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Montar resposta
            $workout_data = [
                "id" => $this->workout->id,
                "user_id" => $this->workout->user_id,
                "name" => $this->workout->name,
                "type" => $this->workout->type,
                "notes" => $this->workout->notes,

                "created_at" => $this->workout->created_at,
                "exercises" => $exercises
            ];

            return ApiResponse::success("Exercício obtido com sucesso", $workout_data);
        } else {
            return ApiResponse::notFound("Exercícios não encontrado");
        }
    }

    // Listar todos os treinos
    public function listWorkouts() {
        // Obter ID do treino da URL
        $id = isset($_GET['id']) ? $_GET['id'] : null;

        if(!$id) {
            return ApiResponse::error("ID do treino não fornecido");
        }

        // Buscar treino pelo ID fornecido
        $this->workout->id = $id;
        if(!$this->workout->readOne()) {
            return ApiResponse::notFound("Treino não encontrado");
        }

        // Obter exercícios do treino
        $stmt = $this->workout->getWorkoutExercises();

        $workouts = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $workouts[] = $row;
        }

        return ApiResponse::success("Treinos obtidos com sucesso", $workouts);
    }

    // Adicionar exercício a um treino
    public function addExercise() {


        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->workout_id) || !isset($data->exercise_id)) {
            return ApiResponse::error("ID do treino e ID do exercício são obrigatórios");
        }

        // Verificar se o treino existe
        $this->workout->id = $data->workout_id;
        if(!$this->workout->readOne()) {
            return ApiResponse::notFound("Treino não encontrado");
        }

        // Obter índice do próximo exercício
        $stmt = $this->workout->getWorkoutExercises();
        $order_index = $stmt->rowCount() + 1;

        // Adicionar exercício ao treino
        $workout_set_id = $this->workout->addExercise(
            $data->workout_id,
            $data->exercise_id,
            $data->sets ?? 1,
            $data->reps ?? 10,
            $data->rest_seconds ?? 60,
            $data->duration_seconds ?? null,
            $order_index
        );

        if($workout_set_id) {
            return ApiResponse::success("Exercício adicionado com sucesso", ["id" => $workout_set_id]);
        } else {
            return ApiResponse::serverError("Erro ao adicionar exercício");
        }
    }

    // Remover exercício de um treino
    public function removeExercise() {
        // Verificar autenticação
        $user_data = $this->authHelper->getUserFromToken();

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar tipo de usuário
        if($user_data['type_name'] != 'admin' && $user_data['type_name'] != 'trainer') {
            return ApiResponse::unauthorized("Acesso não autorizado");
        }

        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->workout_set_id)) {
            return ApiResponse::error("ID do conjunto de exercício é obrigatório");
        }

        // Remover exercício do treino
        if($this->workout->removeExercise($data->workout_set_id)) {
            return ApiResponse::success("Exercício removido com sucesso");
        } else {
            return ApiResponse::serverError("Erro ao remover exercício");
        }
    }

    // Atualizar exercício de um treino
    public function updateExercise() {
        // Verificar autenticação
        $user_data = $this->authHelper->getUserFromToken();

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar tipo de usuário
        if($user_data['type_name'] != 'admin' && $user_data['type_name'] != 'trainer') {
            return ApiResponse::unauthorized("Acesso não autorizado");
        }

        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->workout_set_id)) {
            return ApiResponse::error("ID do conjunto de exercício é obrigatório");
        }

        // Atualizar exercício do treino
        if($this->workout->updateExercise(
            $data->workout_set_id,
            $data->sets ?? 1,
            $data->reps ?? 10,
            $data->rest_seconds ?? 60,
            $data->duration_seconds ?? null,
            $data->order_index ?? 1
        )) {
            return ApiResponse::success("Exercício atualizado com sucesso");
        } else {
            return ApiResponse::serverError("Erro ao atualizar exercício");
        }
    }

    // Obter todos os exercícios disponíveis
    public function getAllExercises() {


        // Filtrar por tipo se fornecido
        $type = isset($_GET['type']) ? $_GET['type'] : null;

        // Obter exercícios
        if($type) {
            $stmt = $this->exercise->readByType($type);
        } else {
            $stmt = $this->exercise->readAll();
        }

        $exercises = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $exercises[] = $row;
        }

        return ApiResponse::success("Exercícios obtidos com sucesso", $exercises);
    }

    // Excluir um treino e todos os seus exercícios
    public function deleteWorkout() {
        // Verificar autenticação
          $user_data = $this->authHelper->getUserFromToken();

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar tipo de usuário
        if($user_data['type_name'] != 'admin' && $user_data['type_name'] != 'trainer') {
            return ApiResponse::unauthorized("Acesso não autorizado");
        }

        // Verificar se o ID foi fornecido
        $id = isset($_GET['id']) ? $_GET['id'] : null;

        if(!$id) {
            return ApiResponse::error("ID do treino é obrigatório");
        }

        // Verificar se o treino existe
        $this->workout->id = $id;
        if(!$this->workout->readOne()) {
            return ApiResponse::notFound("Treino não encontrado");
        }

        // Excluir treino
        if($this->workout->delete()) {
            return ApiResponse::success("Treino excluído com sucesso");
        } else {
            return ApiResponse::serverError("Erro ao excluir treino");
        }
    }

    // Finalizar uma sessão de treino
    public function finishWorkoutSession() {
        // Verificar autenticação
        $user_data = $this->authHelper->getUserFromToken();

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->session_id) || !isset($data->total_time) || !isset($data->total_distance)) {
            return ApiResponse::error("Dados incompletos para finalizar a sessão");
        }

        // Atualizar sessão de treino
        if($this->workout->finishWorkoutSession(
            $data->session_id,
            $data->total_time,
            $data->total_distance,
            $data->notes ?? ''
        )) {
            return ApiResponse::success("Sessão de treino finalizada com sucesso");
        } else {
            return ApiResponse::serverError("Erro ao finalizar sessão de treino");
        }
    }

    // Atribuir um treino a um aluno
    public function assignWorkout() {
        // Verificar autenticação
        $user_data = $this->authHelper->getUserFromToken();

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
            return ApiResponse::error("Dados incompletos para atribuir o treino");
        }

        // Atribuir treino ao aluno
        $assigned_id = $this->workout->assignWorkout(
            $data->workout_id,
            $data->student_id,
            $data->scheduled_date ?? null,
            $data->notes ?? ''
        );

        if($assigned_id) {
            return ApiResponse::success("Treino atribuído com sucesso", ["id" => $assigned_id]);
        } else {
            return ApiResponse::serverError("Erro ao atribuir treino");
        }
    }

    // Listar treinos atribuídos
    public function listAssignedWorkouts() {
        // Verificar autenticação
        $user_data = $this->authHelper->getUserFromToken();

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar se há filtro por aluno ou personal
        $student_id = isset($_GET['student_id']) ? $_GET['student_id'] : null;
        $trainer_id = isset($_GET['trainer_id']) ? $_GET['trainer_id'] : null;
        $status = isset($_GET['status']) ? $_GET['status'] : null;

        // Obter treinos atribuídos com base nos filtros
        $stmt = $this->workout->getAssignedWorkouts($student_id, $trainer_id, $status);

        $workouts = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $workouts[] = $row;
        }

        return ApiResponse::success("Treinos atribuídos obtidos com sucesso", $workouts);
    }

    // Iniciar uma sessão de treino
    public function startWorkoutSession() {
        // Verificar autenticação
        $user_data = $this->authHelper->getUserFromToken();

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->assigned_workout_id)) {
            return ApiResponse::error("ID do treino atribuído é obrigatório");
        }

        // Iniciar sessão de treino
        $session_id = $this->workout->startWorkoutSession(
            $data->assigned_workout_id,
            $user_data['id']
        );

        if($session_id) {
            return ApiResponse::success("Sessão de treino iniciada com sucesso", ["session_id" => $session_id]);
        } else {
            return ApiResponse::serverError("Erro ao iniciar sessão de treino");
        }
    }

    // Registrar uma volta/repetição de exercício
    public function recordLap() {
        // Verificar autenticação
        $user_data = $this->authHelper->getUserFromToken();

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
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

    // Obter detalhes de uma sessão de treino
    public function getWorkoutSession() {
        // Verificar autenticação
        $user_data = $this->authHelper->getUserFromToken();

        if(!$user_data) {
            return ApiResponse::unauthorized("Token inválido ou expirado");
        }

        // Verificar se o ID foi fornecido
        $id = isset($_GET['id']) ? $_GET['id'] : null;

        if(!$id) {
            return ApiResponse::error("ID da sessão é obrigatório");
        }

        // Obter detalhes da sessão
        $session = $this->workout->getWorkoutSession($id);

        if($session) {
            return ApiResponse::success("Sessão de treino obtida com sucesso", $session);
        } else {
            return ApiResponse::notFound("Sessão de treino não encontrada");
        }
    }
}
?>
