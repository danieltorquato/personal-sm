-- Criação do Banco de Dados
CREATE DATABASE IF NOT EXISTS swimming_training;
USE swimming_training;

-- Tabela de Tipos de Usuários
CREATE TABLE user_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- Tabela de Usuários (Alunos, Personais e Admin)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    user_type_id INT NOT NULL,
    profile_picture VARCHAR(255),
    birthdate DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_type_id) REFERENCES user_types(id)
);

-- Tabela de Relacionamento Aluno-Personal
CREATE TABLE student_trainer (
    student_id INT,
    trainer_id INT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, trainer_id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (trainer_id) REFERENCES users(id)
);

-- Tabela de Configurações do Usuário
CREATE TABLE user_settings (
    user_id INT PRIMARY KEY,
    theme VARCHAR(50) DEFAULT 'dark',
    notification_enabled BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    language VARCHAR(10) DEFAULT 'pt-BR',
    pool_length INT DEFAULT 25,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de Nados
CREATE TABLE stroke_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- Tabela de Treinos
CREATE TABLE workouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level ENUM('iniciante', 'intermediario', 'avancado') NOT NULL,
    created_by INT NOT NULL,
    total_distance INT NOT NULL,
    estimated_duration INT NOT NULL,
    is_template BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tabela de Séries do Treino
CREATE TABLE workout_sets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workout_id INT,
    exercise_name VARCHAR(100) NOT NULL,
    stroke_type_id INT,
    distance INT NOT NULL,
    repetitions INT NOT NULL,
    rest_time INT NOT NULL,
    notes TEXT,
    order_position INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (stroke_type_id) REFERENCES stroke_types(id)
);

-- Tabela de Treinos Atribuídos
CREATE TABLE assigned_workouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    workout_id INT,
    assigned_by INT,
    status ENUM('pendente', 'em_andamento', 'concluido', 'cancelado') DEFAULT 'pendente',
    assigned_date DATE NOT NULL,
    due_date DATE,
    progress INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (workout_id) REFERENCES workouts(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- Tabela de Sessões de Treino
CREATE TABLE workout_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assigned_workout_id INT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status ENUM('em_andamento', 'concluido', 'cancelado') DEFAULT 'em_andamento',
    total_time INT,
    total_distance INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_workout_id) REFERENCES assigned_workouts(id)
);

-- Tabela de Execução de Séries
CREATE TABLE set_executions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workout_session_id INT,
    workout_set_id INT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status ENUM('pendente', 'em_andamento', 'concluido', 'pulado') DEFAULT 'pendente',
    FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id),
    FOREIGN KEY (workout_set_id) REFERENCES workout_sets(id)
);

-- Tabela de Voltas Registradas
CREATE TABLE laps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    set_execution_id INT,
    repetition_number INT NOT NULL,
    lap_time INT NOT NULL,
    pace VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (set_execution_id) REFERENCES set_executions(id)
);

-- Tabela de Histórico do Progresso do Aluno
CREATE TABLE progress_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    date DATE NOT NULL,
    total_distance INT NOT NULL,
    total_time INT NOT NULL,
    average_pace VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de Mensagens
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT,
    receiver_id INT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

-- Tabela de Notificações
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de Tokens de Recuperação de Senha
CREATE TABLE password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de Tokens de Autenticação
CREATE TABLE auth_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    token VARCHAR(255) NOT NULL,
    device VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Índices para melhor performance
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_type ON users(user_type_id);
CREATE INDEX idx_workout_created_by ON workouts(created_by);
CREATE INDEX idx_assigned_workout_user ON assigned_workouts(user_id);
CREATE INDEX idx_assigned_workout_status ON assigned_workouts(status);
CREATE INDEX idx_workout_session_assigned ON workout_sessions(assigned_workout_id);
CREATE INDEX idx_set_execution_session ON set_executions(workout_session_id);
CREATE INDEX idx_lap_set_execution ON laps(set_execution_id);
CREATE INDEX idx_message_sender ON messages(sender_id);
CREATE INDEX idx_message_receiver ON messages(receiver_id);
CREATE INDEX idx_notification_user ON notifications(user_id);

-- Inserção de dados iniciais

-- Tipos de Usuários
INSERT INTO user_types (type_name, description) VALUES
('admin', 'Administrador do sistema'),
('trainer', 'Personal de natação'),
('student', 'Aluno que pratica natação');

-- Nados
INSERT INTO stroke_types (name, description) VALUES
('Crawl', 'Nado livre de frente'),
('Costas', 'Nado de costas'),
('Peito', 'Nado peito'),
('Borboleta', 'Nado borboleta'),
('Medley', 'Combinação de todos os nados');

-- Usuários Iniciais
-- Senhas estão em hash usando password_hash("senha123", PASSWORD_DEFAULT)
INSERT INTO users (name, email, password, phone, user_type_id) VALUES
('Admin', 'admin@exemplo.com', '$2y$10$Z7C9SfCNwmV1XCl2YQVPo.y7dtOTrfpR7dBOrJsvE0T9T4vx1O7zC', '11900000000', 1),
('Daniel Torquato', 'daniel.torquato@exemplo.com', '$2y$10$Z7C9SfCNwmV1XCl2YQVPo.y7dtOTrfpR7dBOrJsvE0T9T4vx1O7zC', '11987654321', 2),
('João Monteiro', 'joao.monteiro@exemplo.com', '$2y$10$Z7C9SfCNwmV1XCl2YQVPo.y7dtOTrfpR7dBOrJsvE0T9T4vx1O7zC', '11912345678', 3);

-- Configurações de Usuários
INSERT INTO user_settings (user_id, theme, pool_length) VALUES
(1, 'dark', 25),
(2, 'dark', 25),
(3, 'dark', 25);

-- Relacionamento Aluno-Personal
INSERT INTO student_trainer (student_id, trainer_id, start_date) VALUES
(3, 2, CURDATE());

-- Treino Exemplo
INSERT INTO workouts (name, description, level, created_by, total_distance, estimated_duration, is_template) VALUES
('Treino Iniciante', 'Treino para alunos iniciantes', 'iniciante', 2, 1000, 30, TRUE);

-- Séries do Treino Exemplo
INSERT INTO workout_sets (workout_id, exercise_name, stroke_type_id, distance, repetitions, rest_time, notes, order_position) VALUES
(1, 'Aquecimento', 1, 100, 1, 30, 'Nadar devagar para aquecer', 1),
(1, 'Técnica de Crawl', 1, 50, 4, 30, 'Focar na técnica e respiração', 2),
(1, 'Técnica de Costas', 2, 50, 4, 30, 'Manter o corpo alinhado', 3),
(1, 'Sprint Final', 1, 100, 2, 60, 'Nadar em velocidade máxima', 4);

-- Treino Atribuído
INSERT INTO assigned_workouts (user_id, workout_id, assigned_by, assigned_date, due_date) VALUES
(3, 1, 2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY));

-- Notificação Inicial
INSERT INTO notifications (user_id, title, message, type) VALUES
(3, 'Bem-vindo!', 'Bem-vindo ao sistema de treino de natação. Seu personal já atribuiu um treino para você.', 'info');
