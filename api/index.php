<?php
// Habilitar o CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Lidar com requisições OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Incluir arquivos de configuração
require_once "config/Database.php";
require_once "helpers/ApiResponse.php";

// Obter conexão com o banco de dados
$database = new Database();
$db = $database->getConnection();

// Obter a rota da URL
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = explode('/', $uri);

// Encontrar o endpoint e a ação
$endpoint = $uri[count($uri) - 2] ?? '';
$action = $uri[count($uri) - 1] ?? '';

// Rota não encontrada
if (empty($endpoint) || empty($action)) {
    echo ApiResponse::error("Rota não encontrada", 404);
    exit;
}

// Roteamento para os controladores apropriados
try {
    switch ($endpoint) {
        case 'users':
            require_once "controllers/UserController.php";
            $controller = new UserController($db);

            switch ($action) {
                case 'login':
                    echo $controller->login();
                    break;
                case 'register':
                    echo $controller->register();
                    break;
                case 'profile':
                    echo $controller->getProfile();
                    break;
                case 'update-profile':
                    echo $controller->updateProfile();
                    break;
                case 'change-password':
                    echo $controller->changePassword();
                    break;
                case 'trainers':
                    echo $controller->listTrainers();
                    break;
                case 'students':
                    echo $controller->listStudents();
                    break;
                case 'my-trainer':
                    echo $controller->getStudentTrainer();
                    break;
                case 'assign-trainer':
                    echo $controller->assignStudentToTrainer();
                    break;
                default:
                    echo ApiResponse::notFound("Ação não encontrada");
            }
            break;

        case 'workouts':
            require_once "controllers/WorkoutController.php";
            $controller = new WorkoutController($db);

            switch ($action) {
                case 'create':
                    echo $controller->createWorkout();
                    break;
                case 'update':
                    echo $controller->updateWorkout();
                    break;
                case 'get':
                    echo $controller->getWorkout();
                    break;
                case 'list':
                    echo $controller->listWorkouts();
                    break;
                case 'assign':
                    echo $controller->assignWorkout();
                    break;
                case 'assigned-list':
                    echo $controller->listAssignedWorkouts();
                    break;
                case 'start':
                    echo $controller->startWorkoutSession();
                    break;
                case 'finish':
                    echo $controller->finishWorkoutSession();
                    break;
                case 'record-lap':
                    echo $controller->recordLap();
                    break;
                case 'session':
                    echo $controller->getWorkoutSession();
                    break;
                default:
                    echo ApiResponse::notFound("Ação não encontrada");
            }
            break;

        case 'dashboard':
            require_once "controllers/DashboardController.php";
            $controller = new DashboardController($db);

            switch ($action) {
                case 'personal':
                    echo $controller->getPersonalDashboard();
                    break;
                case 'pupil':
                    echo $controller->getPupilDashboard();
                    break;
                case 'stats':
                    echo $controller->getStats();
                    break;
                case 'upcoming-workouts':
                    echo $controller->getUpcomingWorkouts();
                    break;
                case 'recent-sessions':
                    echo $controller->getRecentSessions();
                    break;
                default:
                    echo ApiResponse::notFound("Ação não encontrada");
            }
            break;

        case 'personal':
            require_once "controllers/PersonalController.php";
            $controller = new PersonalController($db);

            switch ($action) {
                case 'pupils':
                    echo $controller->getPupils();
                    break;
                default:
                    echo ApiResponse::notFound("Ação não encontrada");
            }
            break;

        default:
            echo ApiResponse::notFound("Endpoint não encontrado");
    }
} catch (Exception $e) {
    echo ApiResponse::serverError("Erro: " . $e->getMessage());
}
?>
