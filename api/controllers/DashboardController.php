<?php
require_once "models/Dashboard.php";
require_once "helpers/AuthHelper.php";

class DashboardController {
    private $conn;
    private $dashboard;
    private $authHelper;

    // Construtor
    public function __construct($db) {
        $this->conn = $db;
        $this->dashboard = new Dashboard($db);
        $this->authHelper = new AuthHelper();
    }

    /**
     * Obtém os dados para o dashboard do personal
     * @return string JSON com os dados do dashboard
     */
    public function getPersonalDashboard() {
        // Verificar token de autenticação
        $userData = $this->authHelper->getUserFromToken();
        if (!$userData) {
            return ApiResponse::unauthorized("Usuário não autenticado");
        }

        // Verificar se o usuário é um personal
        if ($userData['role'] !== 'trainer') {
            return ApiResponse::forbidden("Acesso negado. Apenas personais podem acessar estes dados");
        }

        $personalId = $userData['id'];

        // Obter estatísticas e agenda
        $stats = $this->dashboard->getPersonalStats($personalId);
        $schedule = $this->dashboard->getPersonalSchedule($personalId);

        // Retornar dados completos do dashboard
        return ApiResponse::success([
            'stats' => $stats,
            'schedule' => $schedule
        ]);
    }

    /**
     * Obtém os dados para o dashboard do aluno
     * @return string JSON com os dados do dashboard
     */
    public function getPupilDashboard() {
        // Verificar token de autenticação
        $userData = $this->authHelper->getUserFromToken();
        if (!$userData) {
            return ApiResponse::unauthorized("Usuário não autenticado");
        }

        // Verificar se o usuário é um aluno
        if ($userData['role'] !== 'student') {
            return ApiResponse::forbidden("Acesso negado. Apenas alunos podem acessar estes dados");
        }

        $studentId = $userData['id'];

        // Obter todos os dados necessários para o dashboard
        $stats = $this->dashboard->getPupilStats($studentId);
        $upcomingWorkouts = $this->dashboard->getPupilUpcomingWorkouts($studentId);
        $recentSessions = $this->dashboard->getPupilRecentSessions($studentId);

        // Dados do personal do aluno
        $personalData = $this->getStudentTrainerData($studentId);

        // Retornar dados completos do dashboard
        return ApiResponse::success([
            'stats' => $stats,
            'upcomingWorkouts' => $upcomingWorkouts,
            'recentSessions' => $recentSessions,
            'trainer' => $personalData
        ]);
    }

    /**
     * Obtém apenas as estatísticas
     * @return string JSON com estatísticas para o dashboard
     */
    public function getStats() {
        // Verificar token de autenticação
        $userData = $this->authHelper->getUserFromToken();
        if (!$userData) {
            return ApiResponse::unauthorized("Usuário não autenticado");
        }

        $userId = $userData['id'];
        $role = $userData['role'];

        // Retornar estatísticas com base no tipo de usuário
        if ($role === 'trainer') {
            $stats = $this->dashboard->getPersonalStats($userId);
        } else if ($role === 'student') {
            $stats = $this->dashboard->getPupilStats($userId);
        } else {
            return ApiResponse::forbidden("Tipo de usuário não suportado");
        }

        return ApiResponse::success($stats);
    }

    /**
     * Obtém próximos treinos agendados
     * @return string JSON com próximos treinos
     */
    public function getUpcomingWorkouts() {
        // Verificar token de autenticação
        $userData = $this->authHelper->getUserFromToken();
        if (!$userData) {
            return ApiResponse::unauthorized("Usuário não autenticado");
        }

        $userId = $userData['id'];
        $role = $userData['role'];

        // Alunos veem seus próximos treinos
        if ($role === 'student') {
            $workouts = $this->dashboard->getPupilUpcomingWorkouts($userId);
            return ApiResponse::success($workouts);
        }
        // Personais veem a agenda de hoje
        else if ($role === 'trainer') {
            $schedule = $this->dashboard->getPersonalSchedule($userId);
            return ApiResponse::success($schedule);
        } else {
            return ApiResponse::forbidden("Tipo de usuário não suportado");
        }
    }

    /**
     * Obtém sessões de treino recentes
     * @return string JSON com sessões recentes
     */
    public function getRecentSessions() {
        // Verificar token de autenticação
        $userData = $this->authHelper->getUserFromToken();
        if (!$userData) {
            return ApiResponse::unauthorized("Usuário não autenticado");
        }

        // Apenas alunos podem ver sessões recentes
        if ($userData['role'] !== 'student') {
            return ApiResponse::forbidden("Acesso negado. Apenas alunos podem acessar suas sessões");
        }

        $studentId = $userData['id'];
        $sessions = $this->dashboard->getPupilRecentSessions($studentId);

        return ApiResponse::success($sessions);
    }

    /**
     * Função auxiliar para obter dados do personal do aluno
     * @param int $studentId ID do aluno
     * @return array Dados do personal ou array vazio
     */
    private function getStudentTrainerData($studentId) {
        $query = "SELECT
                    u.id, u.name, u.email, u.avatar,
                    u.bio, u.phone, u.specialties
                 FROM users u
                 JOIN users s ON s.trainer_id = u.id
                 WHERE s.id = ? AND u.role = 'trainer'";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $studentId);
        $stmt->execute();

        $trainerData = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$trainerData) {
            return [];
        }

        // Remover campos sensíveis
        unset($trainerData['password']);

        return $trainerData;
    }
}
?>
