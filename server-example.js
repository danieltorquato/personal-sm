const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'sua_chave_secreta_aqui';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Banco de dados simulado
const users = [
  {
    id: 1,
    email: 'aluno@exemplo.com',
    password: 'senha123',
    name: 'Aluno Teste',
    userType: 'aluno'
  },
  {
    id: 2,
    email: 'personal@exemplo.com',
    password: 'senha123',
    name: 'Personal Teste',
    userType: 'personal'
  },
  {
    id: 3,
    email: 'admin@exemplo.com',
    password: 'senha123',
    name: 'Admin Teste',
    userType: 'admin'
  }
];

// Rota de login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  // Log para debug
  console.log('Tentativa de login:', email);

  // Encontrar usuário
  const user = users.find(u => u.email === email);

  // Verificar se o usuário existe e a senha está correta
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'E-mail ou senha incorretos'
    });
  }

  // Criar token JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email, userType: user.userType },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Retornar dados do usuário (sem a senha)
  const { password: _, ...userWithoutPassword } = user;

  return res.status(200).json({
    success: true,
    user: userWithoutPassword,
    token
  });
});

// Middleware para verificar token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Token não fornecido'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Rota para validar token
app.get('/api/auth/validate-token', verifyToken, (req, res) => {
  res.status(200).json({ valid: true });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor de exemplo rodando na porta ${PORT}`);
  console.log(`API disponível em http://localhost:${PORT}/api`);
});
