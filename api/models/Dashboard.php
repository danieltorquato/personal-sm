<?php
class Dashboard {
    private $conn;

    // Construtor
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Obtém estatísticas para o dashboard do personal
     * @param int $personalId ID do personal
     * @return array Estatísticas do dashboard
     */
    public function getPersonalStats($personalId) {
        // Inicializar estatísticas
        $stats = [
            'students' => 0,
            'activePlans' => 0,
            'sessions' => 0
        ];

        // 1. Contagem de alunos
        $query = "SELECT COUNT(*) as total FROM users WHERE trainer_id = ? AND role = 'student'";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $personalId);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['students'] = $row['total'] ?? 0;

        // 2. Treinos ativos (não completados)
        $query = "SELECT COUNT(*) as total FROM assigned_workouts
                  WHERE trainer_id = ? AND completed = 0";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $personalId);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['activePlans'] = $row['total'] ?? 0;

        // 3. Sessões completadas
        $query = "SELECT COUNT(*) as total FROM workout_sessions
                  WHERE trainer_id = ? AND end_time IS NOT NULL";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $personalId);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['sessions'] = $row['total'] ?? 0;

        return $stats;
    }

    /**
     * Obtém estatísticas para o dashboard do aluno
     * @param int $studentId ID do aluno
     * @return array Estatísticas do dashboard
     */
    public function getPupilStats($studentId) {
        // Inicializar estatísticas
        $stats = [
            'totalWorkouts' => 0,
            'completedWorkouts' => 0,
            'totalDistance' => 0,
            'averageHeartRate' => 0,
            'improvement' => 0
        ];

        // 1. Total de treinos atribuídos
        $query = "SELECT COUNT(*) as total FROM assigned_workouts WHERE student_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $studentId);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['totalWorkouts'] = $row['total'] ?? 0;

        // 2. Treinos completados
        $query = "SELECT COUNT(*) as total FROM assigned_workouts
                  WHERE student_id = ? AND completed = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $studentId);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['completedWorkouts'] = $row['total'] ?? 0;

        // 3. Distância total nadada
        $query = "SELECT SUM(total_distance) as distance FROM workout_sessions
                  WHERE student_id = ? AND end_time IS NOT NULL";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $studentId);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['totalDistance'] = $row['distance'] ?? 0;

        // 4. Frequência cardíaca média
        $query = "SELECT AVG(average_heart_rate) as avg_hr FROM workout_sessions
                  WHERE student_id = ? AND end_time IS NOT NULL AND average_heart_rate > 0";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $studentId);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['averageHeartRate'] = round($row['avg_hr'] ?? 0);

        // 5. Melhoria global (valor calculado baseado em diversos fatores)
        // Este é um cálculo exemplo - pode ser adaptado conforme necessário
        if ($stats['completedWorkouts'] > 0) {
            $query = "SELECT
                         (SELECT AVG(total_time/total_distance) FROM workout_sessions
                          WHERE student_id = ? AND end_time IS NOT NULL
                          ORDER BY start_time DESC LIMIT 3) as recent_pace,
                         (SELECT AVG(total_time/total_distance) FROM workout_sessions
                          WHERE student_id = ? AND end_time IS NOT NULL
                          ORDER BY start_time ASC LIMIT 3) as initial_pace";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(1, $studentId);
            $stmt->bindParam(2, $studentId);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row['initial_pace'] > 0 && $row['recent_pace'] > 0) {
                // Menor pace é melhor, então a melhoria é calculada como:
                // (pace_inicial - pace_recente) / pace_inicial * 100
                $improvement = ($row['initial_pace'] - $row['recent_pace']) / $row['initial_pace'] * 100;
                $stats['improvement'] = round(max(0, $improvement)); // Garantir que seja positivo
            }
        }

        return $stats;
    }

    /**
     * Obtém a agenda de treinos para hoje do personal
     * @param int $personalId ID do personal
     * @return array Lista de treinos agendados para hoje
     */
    public function getPersonalSchedule($personalId) {
        $today = date('Y-m-d');

        $query = "SELECT
                     aw.id, aw.workout_id, aw.student_id,
                     aw.due_date, aw.start_time,
                     w.name as workout_name,
                     u.name as student_name,
                     u.avatar as student_avatar
                  FROM assigned_workouts aw
                  JOIN workouts w ON aw.workout_id = w.id
                  JOIN users u ON aw.student_id = u.id
                  WHERE aw.trainer_id = ?
                     AND aw.due_date = ?
                     AND aw.completed = 0
                  ORDER BY aw.start_time ASC
                  LIMIT 5";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $personalId);
        $stmt->bindParam(2, $today);
        $stmt->execute();

        $schedule = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $schedule[] = [
                'id' => $row['id'],
                'student_id' => $row['student_id'],
                'workout_id' => $row['workout_id'],
                'student_name' => $row['student_name'],
                'activity' => $row['workout_name'],
                'time' => $row['start_time'],
                'avatar' => $row['student_avatar'] ?: '',
                'due_date' => $row['due_date']
            ];
        }

        return $schedule;
    }

    /**
     * Obtém os próximos treinos do aluno
     * @param int $studentId ID do aluno
     * @return array Lista de treinos agendados
     */
    public function getPupilUpcomingWorkouts($studentId) {
        $today = date('Y-m-d');

        $query = "SELECT
                     aw.id, aw.workout_id, aw.trainer_id,
                     aw.due_date, aw.start_time,
                     w.name as workout_name, w.description,
                     u.name as trainer_name,
                     u.avatar as trainer_avatar
                  FROM assigned_workouts aw
                  JOIN workouts w ON aw.workout_id = w.id
                  JOIN users u ON aw.trainer_id = u.id
                  WHERE aw.student_id = ?
                     AND aw.due_date >= ?
                     AND aw.completed = 0
                  ORDER BY aw.due_date ASC, aw.start_time ASC
                  LIMIT 5";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $studentId);
        $stmt->bindParam(2, $today);
        $stmt->execute();

        $workouts = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $workouts[] = [
                'id' => $row['id'],
                'workout_id' => $row['workout_id'],
                'trainer_id' => $row['trainer_id'],
                'workout_name' => $row['workout_name'],
                'description' => $row['description'],
                'trainer_name' => $row['trainer_name'],
                'trainer_avatar' => $row['trainer_avatar'] ?: '',
                'due_date' => $row['due_date'],
                'start_time' => $row['start_time']
            ];
        }

        return $workouts;
    }

    /**
     * Obtém as sessões recentes do aluno
     * @param int $studentId ID do aluno
     * @return array Lista de sessões recentes
     */
    public function getPupilRecentSessions($studentId) {
        $query = "SELECT
                     ws.id, ws.workout_id, ws.start_time, ws.end_time,
                     ws.total_time, ws.total_distance, ws.average_heart_rate,
                     w.name as workout_name,
                     u.name as trainer_name,
                     u.avatar as trainer_avatar
                  FROM workout_sessions ws
                  JOIN workouts w ON ws.workout_id = w.id
                  JOIN users u ON ws.trainer_id = u.id
                  WHERE ws.student_id = ? AND ws.end_time IS NOT NULL
                  ORDER BY ws.end_time DESC
                  LIMIT 5";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $studentId);
        $stmt->execute();

        $sessions = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Calcular ritmo (pace)
            $pace = '';
            if ($row['total_distance'] > 0 && $row['total_time'] > 0) {
                $paceSeconds = ($row['total_time'] / $row['total_distance']) * 100; // Tempo por 100m
                $paceMinutes = floor($paceSeconds / 60);
                $paceRemainderSeconds = floor($paceSeconds % 60);
                $pace = sprintf("%02d:%02d", $paceMinutes, $paceRemainderSeconds);
            }

            $sessions[] = [
                'id' => $row['id'],
                'workout_id' => $row['workout_id'],
                'workout_name' => $row['workout_name'],
                'trainer_name' => $row['trainer_name'],
                'trainer_avatar' => $row['trainer_avatar'] ?: '',
                'date' => date('Y-m-d', strtotime($row['end_time'])),
                'duration' => $row['total_time'],
                'distance' => $row['total_distance'],
                'pace' => $pace,
                'heart_rate' => $row['average_heart_rate']
            ];
        }

        return $sessions;
    }
}
?>
