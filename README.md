# API de Treino de Natação

API para gerenciamento de treinos de natação para personais e alunos.

## Configuração

1. Importe o arquivo SQL para criar o banco de dados
2. Configure as credenciais do banco de dados em `api/config/Database.php`
3. Certifique-se de que o servidor PHP tenha mod_rewrite habilitado

## Endpoints da API

### Usuários

- **POST /api/users/login** - Login de usuário
  - Payload: `{ "email": "email@exemplo.com", "password": "senha" }`
  - Retorno: Dados do usuário e token de autenticação

- **POST /api/users/register** - Registrar novo usuário
  - Payload: `{ "name": "Nome", "email": "email@exemplo.com", "password": "senha", "user_type_id": 3, "phone": "1199999999" }`
  - Retorno: ID do usuário criado

- **GET /api/users/profile** - Obter perfil do usuário autenticado
  - Header: `Authorization: Bearer {token}`
  - Retorno: Dados do perfil do usuário

- **PUT /api/users/update-profile** - Atualizar perfil do usuário
  - Header: `Authorization: Bearer {token}`
  - Payload: `{ "name": "Novo Nome", "phone": "1199999999" }`
  - Retorno: Mensagem de sucesso

- **PUT /api/users/change-password** - Alterar senha do usuário
  - Header: `Authorization: Bearer {token}`
  - Payload: `{ "current_password": "senha_atual", "new_password": "nova_senha" }`
  - Retorno: Mensagem de sucesso

- **GET /api/users/trainers** - Listar todos os personais
  - Retorno: Lista de personais

- **GET /api/users/students** - Listar alunos (para personais e admin)
  - Header: `Authorization: Bearer {token}`
  - Retorno: Lista de alunos

- **GET /api/users/my-trainer** - Obter personal do aluno
  - Header: `Authorization: Bearer {token}` (apenas alunos)
  - Retorno: Dados do personal

- **POST /api/users/assign-trainer** - Atribuir aluno a um personal
  - Header: `Authorization: Bearer {token}` (apenas personais e admin)
  - Payload: `{ "student_id": 3, "trainer_id": 2 }`
  - Retorno: Mensagem de sucesso

### Treinos

- **POST /api/workouts/create** - Criar um novo treino
  - Header: `Authorization: Bearer {token}` (apenas personais e admin)
  - Payload: 
    ```json
    { 
      "name": "Nome do Treino", 
      "description": "Descrição", 
      "level": "iniciante", 
      "total_distance": 1000, 
      "estimated_duration": 30,
      "is_template": false,
      "sets": [
        {
          "exercise_name": "Aquecimento",
          "stroke_type_id": 1,
          "distance": 100,
          "repetitions": 1,
          "rest_time": 30,
          "notes": "Nadar devagar"
        },
        {
          "exercise_name": "Sprint",
          "stroke_type_id": 1,
          "distance": 50,
          "repetitions": 4,
          "rest_time": 30,
          "notes": "Velocidade máxima"
        }
      ]
    }
    ```
  - Retorno: ID do treino criado

- **PUT /api/workouts/update** - Atualizar um treino
  - Header: `Authorization: Bearer {token}` (apenas personais e admin)
  - Payload: `{ "id": 1, "name": "Novo Nome", "description": "Nova Descrição" }`
  - Retorno: Mensagem de sucesso

- **GET /api/workouts/get?id=1** - Obter detalhes de um treino
  - Header: `Authorization: Bearer {token}`
  - Retorno: Dados do treino e suas séries

- **GET /api/workouts/list** - Listar treinos
  - Header: `Authorization: Bearer {token}`
  - Retorno: Lista de treinos

- **POST /api/workouts/assign** - Atribuir treino a um aluno
  - Header: `Authorization: Bearer {token}` (apenas personais e admin)
  - Payload: `{ "workout_id": 1, "student_id": 3, "due_date": "2023-12-31" }`
  - Retorno: ID do treino atribuído

- **GET /api/workouts/assigned-list** - Listar treinos atribuídos a um aluno
  - Header: `Authorization: Bearer {token}`
  - Query: `student_id=3` (opcional para personais e admin)
  - Retorno: Lista de treinos atribuídos

- **POST /api/workouts/start** - Iniciar uma sessão de treino
  - Header: `Authorization: Bearer {token}` (apenas alunos)
  - Payload: `{ "assigned_workout_id": 1 }`
  - Retorno: ID da sessão de treino

- **POST /api/workouts/finish** - Finalizar uma sessão de treino
  - Header: `Authorization: Bearer {token}` (apenas alunos)
  - Payload: `{ "session_id": 1, "total_time": 1800, "total_distance": 1000, "notes": "Treino completado" }`
  - Retorno: Mensagem de sucesso

- **POST /api/workouts/record-lap** - Registrar uma volta
  - Header: `Authorization: Bearer {token}` (apenas alunos)
  - Payload: `{ "set_execution_id": 1, "repetition_number": 1, "lap_time": 60 }`
  - Retorno: ID da volta registrada

## Códigos de Status HTTP

- 200: Sucesso
- 201: Criado com sucesso
- 400: Erro na requisição
- 401: Não autorizado
- 404: Recurso não encontrado
- 500: Erro interno do servidor

## Autenticação

A API usa autenticação baseada em token. Para acessar endpoints protegidos, é necessário incluir o token no header da requisição:

```
Authorization: Bearer {token}
```

O token é obtido após o login bem-sucedido. 
