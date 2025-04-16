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


        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->assigned_workout_id)) {
            return ApiResponse::error("ID do treino atribuído é obrigatório");
        }

        // Iniciar sessão de treino
        $session_id = $this->workout->startWorkoutSession(
            $data->assigned_workout_id,
            $data->user_id
        );

        if($session_id) {
            return ApiResponse::success("Sessão de treino iniciada com sucesso", ["session_id" => $session_id]);
        } else {
            return ApiResponse::serverError("Erro ao iniciar sessão de treino");
        }
    }

    // Registrar uma volta/repetição de exercício
    public function recordLap() {

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

    // Verificar se um aluno tem treinos ativos
    public function checkActiveWorkouts() {

        // Obter ID do aluno da query string
        $student_id = isset($_GET['student_id']) ? $_GET['student_id'] : null;

        if(!$student_id) {
            return ApiResponse::error("ID do aluno é obrigatório");
        }

        // Query para buscar treinos ativos
        $query = "SELECT * FROM workouts
                 WHERE user_id = :student_id
                 AND validate_to >= NOW()
                 ORDER BY created_at DESC
                 LIMIT 1";

        // Preparar a query
        $stmt = $this->db->prepare($query);

        // Sanitizar
        $student_id = htmlspecialchars(strip_tags($student_id));

        // Vincular
        $stmt->bindParam(":student_id", $student_id);

        // Executar
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return ApiResponse::success("Aluno tem treino ativo", [
                "hasActiveWorkout" => true,
                "workout" => $row
            ]);
        } else {
            return ApiResponse::success("Aluno não tem treinos ativos", [
                "hasActiveWorkout" => false
            ]);
        }
    }

    // Desativar treinos anteriores do aluno
    public function deactivatePreviousWorkouts() {
        // Verificar se os dados foram enviados
        $data = json_decode(file_get_contents("php://input"));

        if(!$data || !isset($data->student_id)) {
            return ApiResponse::error("ID do aluno é obrigatório");
        }

        // Sanitizar
        $student_id = htmlspecialchars(strip_tags($data->student_id));

        // Data de ontem com hora 23:59:59 para desativar treinos
        $yesterday = date('Y-m-d 23:59:59', strtotime('-1 day'));

        // Query para atualizar todos os treinos ativos do aluno para expirados
        $query = "UPDATE workouts
                 SET validate_to = :yesterday
                 WHERE user_id = :student_id
                 AND validate_to >= NOW()";

        // Preparar a query
        $stmt = $this->db->prepare($query);

        // Vincular
        $stmt->bindParam(":yesterday", $yesterday);
        $stmt->bindParam(":student_id", $student_id);

        // Executar
        if($stmt->execute()) {
            return ApiResponse::success("Treinos anteriores desativados com sucesso", [
                "affected_rows" => $stmt->rowCount()
            ]);
        } else {
            return ApiResponse::serverError("Erro ao desativar treinos anteriores");
        }
    }

    // Upload de mídia (imagem e vídeo) para exercícios
    public function uploadExerciseMedia() {
        // Headers para API RESTful
        header("Access-Control-Allow-Origin: *");
        header("Content-Type: application/json; charset=UTF-8");
        header("Access-Control-Allow-Methods: POST");
        header("Access-Control-Max-Age: 3600");
        header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

        // Verificar se a requisição é POST
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(array("message" => "Método não permitido. Use POST."));
            return;
        }

        try {
            // Log de todos os dados recebidos
            error_log("Dados POST recebidos: " . print_r($_POST, true));
            error_log("Arquivos recebidos: " . print_r($_FILES, true));

            // Obter ID do exercício
            if (!isset($_POST['exercise_id']) || empty($_POST['exercise_id'])) {
                throw new Exception("ID do exercício é obrigatório");
            }

            $exercise_id = $_POST['exercise_id'];
            error_log("ID do exercício: " . $exercise_id);

            // Instanciar banco de dados
            $database = new Database();
            $db = $database->getConnection();

            // Instanciar exercício
            $exercise = new Exercise($db);
            $exercise->id = $exercise_id;

            // Verificar se o exercício existe
            if (!$exercise->readOne()) {
                throw new Exception("Exercício não encontrado");
            }

            // Diretório para salvar as mídias
            $upload_dir = __DIR__ . "/../../src/assets/images/exercises/";

            // Criar diretório se não existir
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }

            $response_data = [];

            // Processar imagem
            if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
                $image_info = getimagesize($_FILES['image']['tmp_name']);

                // Verificar se é uma imagem válida
                if ($image_info === false) {
                    throw new Exception("Arquivo de imagem inválido");
                }

                // Extensão do arquivo
                $image_ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);

                // Nome único para o arquivo
                $image_filename = "exercise_" . $exercise_id . "_" . time() . "." . $image_ext;
                $image_path = $upload_dir . $image_filename;

                error_log("Caminho da imagem: " . $image_path);

                // Mover a imagem
                if (!move_uploaded_file($_FILES['image']['tmp_name'], $image_path)) {
                    throw new Exception("Erro ao salvar a imagem: " . error_get_last()['message']);
                }

                // Atualizar caminho da imagem no banco (usar o caminho relativo assets/images/exercises)
                $exercise->image_path = "assets/images/exercises/" . $image_filename;
                $response_data['image_path'] = $exercise->image_path;
            }

            // Processar vídeo
            if (isset($_FILES['video']) && $_FILES['video']['error'] == 0) {
                // Verificar tipo de arquivo
                $allowed_video_types = ['video/mp4', 'video/webm', 'video/ogg'];
                if (!in_array($_FILES['video']['type'], $allowed_video_types)) {
                    throw new Exception("Tipo de vídeo não suportado. Use MP4, WebM ou OGG");
                }

                // Extensão do arquivo
                $video_ext = pathinfo($_FILES['video']['name'], PATHINFO_EXTENSION);

                // Nome único para o arquivo
                $video_filename = "exercise_" . $exercise_id . "_" . time() . "." . $video_ext;
                $video_path = $upload_dir . $video_filename;

                error_log("Caminho do vídeo: " . $video_path);

                // Mover o vídeo
                if (!move_uploaded_file($_FILES['video']['tmp_name'], $video_path)) {
                    throw new Exception("Erro ao salvar o vídeo: " . error_get_last()['message']);
                }

                // Atualizar caminho do vídeo no banco (usar o caminho relativo assets/images/exercises)
                $exercise->video_path = "assets/images/exercises/" . $video_filename;
                $response_data['video_path'] = $exercise->video_path;
            }

            // Atualizar o exercício se alguma mídia foi processada
            if (!empty($response_data)) {
                if (!$exercise->update()) {
                    throw new Exception("Erro ao atualizar informações de mídia no banco de dados");
                }

                // Resposta de sucesso
                http_response_code(200);
                echo json_encode([
                    "status" => true,
                    "message" => "Mídia carregada com sucesso",
                    "data" => $response_data
                ]);
            } else {
                throw new Exception("Nenhuma mídia enviada ou processada");
            }

        } catch (Exception $e) {
            http_response_code(400);
            error_log("Erro no upload de mídia: " . $e->getMessage());
            echo json_encode([
                "status" => false,
                "message" => $e->getMessage()
            ]);
        }
    }
}

