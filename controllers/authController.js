/**
 * Controlador de autenticação
 * Implementa funcionalidades de login e gerenciamento de usuários
 */
const { createSendToken } = require('../middlewares/authMiddleware');
const { AppError, catchAsync } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// Simulação de banco de dados de usuários para o MVP
const users = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: '$2a$12$qJKhDFZS9Wd.hgrDe1RnEOmxA.bRRZLYNMjYy6bhMYfv5c7Wc1cHy', // 'password123'
    role: 'admin'
  },
  {
    id: '2',
    name: 'Test User',
    email: 'user@example.com',
    password: '$2a$12$qJKhDFZS9Wd.hgrDe1RnEOmxA.bRRZLYNMjYy6bhMYfv5c7Wc1cHy', // 'password123'
    role: 'user'
  }
];

// Função para simular verificação de senha (em produção usaria bcrypt)
const checkPassword = (inputPassword, storedPassword) => {
  // Simulação simples para o MVP
  return inputPassword === 'password123';
};

// Controlador para login
const login = catchAsync(async (req, res, next) => {
  logger.info({
    type: 'auth_login_attempt',
    email: req.body.email ? req.body.email.substring(0, 3) + '***@' + req.body.email.split('@')[1] : 'undefined',
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.requestId
  });

  const { email, password } = req.body;

  // 1) Verificar se email e senha foram fornecidos
  if (!email || !password) {
    logger.warn({
      type: 'auth_missing_credentials',
      ip: req.ip,
      requestId: req.requestId
    });
    return next(new AppError('Por favor, forneça email e senha', 400));
  }

  // 2) Verificar se o usuário existe e a senha está correta
  const user = users.find(u => u.email === email);
  
  if (!user || !checkPassword(password, user.password)) {
    logger.warn({
      type: 'auth_failed_login',
      reason: !user ? 'user_not_found' : 'invalid_password',
      email: email.substring(0, 3) + '***@' + email.split('@')[1],
      ip: req.ip,
      attempts: 1, // Em uma implementação real, seria bom rastrear tentativas consecutivas
      requestId: req.requestId
    });
    return next(new AppError('Email ou senha incorretos', 401));
  }

  // 3) Se tudo estiver ok, enviar token para o cliente
  logger.info({
    type: 'auth_successful_login',
    userId: user.id,
    role: user.role,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.requestId
  });
  createSendToken(user, 200, res);
});

// Controlador para obter perfil do usuário atual
const getMe = catchAsync(async (req, res, next) => {
  logger.info({
    type: 'user_profile_access',
    userId: req.user.id,
    ip: req.ip,
    requestId: req.requestId
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

module.exports = {
  login,
  getMe
};
