/**
 * Arquivo para teste simples do servidor
 * Inclui rotas básicas, autenticação e logs
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');

// Criar aplicação Express para teste
const app = express();

// Middlewares básicos
app.use(helmet());
app.use(cors());
app.use(express.json());

// Middleware de logs simples
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Middleware de autenticação simples
const auth = (req, res, next) => {
  try {
    // Verificar se existe token no header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'fail',
        message: 'Não autorizado. Token não fornecido ou inválido.'
      });
    }
    
    // Extrair o token
    const token = authHeader.split(' ')[1];
    
    // Verificar token
    const decoded = jwt.verify(token, 'sua_chave_secreta_jwt');
    
    // Adicionar usuário decodificado à requisição
    req.user = decoded.user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'fail',
      message: 'Não autorizado. Token inválido.'
    });
  }
};

// Usuários para teste
const users = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin'
  },
  {
    id: '2',
    name: 'Test User',
    email: 'user@example.com',
    password: 'password123',
    role: 'user'
  }
];

// Logs simulados para teste
const fakeLogs = [
  { timestamp: new Date().toISOString(), level: 'info', message: 'Servidor iniciado', service: 'api' },
  { timestamp: new Date().toISOString(), level: 'info', message: 'Conexão com banco de dados estabelecida', service: 'database' },
  { timestamp: new Date().toISOString(), level: 'info', message: 'Novo usuário registrado', service: 'auth' },
  { timestamp: new Date().toISOString(), level: 'error', message: 'Falha na conexão com serviço externo', service: 'external-api' },
  { timestamp: new Date().toISOString(), level: 'warn', message: 'Alto uso de memória detectado', service: 'monitoring' }
];

// Rota principal
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Servidor de teste funcionando corretamente!',
    timestamp: new Date().toISOString()
  });
});

// Rota de saúde (health check)
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Servidor funcionando normalmente',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Rota de login
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Verificar se email e senha foram fornecidos
  if (!email || !password) {
    return res.status(400).json({
      status: 'fail',
      message: 'Por favor, forneça email e senha'
    });
  }
  
  // Verificar se o usuário existe e a senha está correta
  const user = users.find(u => u.email === email);
  
  if (!user || user.password !== password) {
    return res.status(401).json({
      status: 'fail',
      message: 'Email ou senha incorretos'
    });
  }
  
  // Criar token JWT
  const token = jwt.sign(
    { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    'sua_chave_secreta_jwt',
    { expiresIn: '1h' }
  );
  
  // Enviar resposta com token
  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});

// Rota para obter perfil do usuário
app.get('/api/v1/users/me', auth, (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

// Rota para obter logs
app.get('/api/v1/logs', auth, (req, res) => {
  // Parâmetros de consulta para filtragem
  const { level = 'all', limit = 100, page = 1 } = req.query;
  
  // Filtrar por nível se especificado
  let logs = fakeLogs;
  if (level !== 'all') {
    logs = logs.filter(log => log.level === level);
  }
  
  // Paginação simples
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedLogs = logs.slice(startIndex, endIndex);
  
  // Enviar resposta
  res.status(200).json({
    status: 'success',
    results: paginatedLogs.length,
    total: logs.length,
    page: Number(page),
    limit: Number(limit),
    data: {
      logs: paginatedLogs
    }
  });
});

// Iniciar servidor de teste
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor de teste rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT} para ver o servidor funcionando`);
  console.log(`Acesse http://localhost:${PORT}/api/v1/health para verificar o health check`);
});