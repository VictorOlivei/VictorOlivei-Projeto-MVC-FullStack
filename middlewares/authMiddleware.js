/**
 * Middleware de autenticação e autorização
 * Implementa login seguro e controle de acesso com JWT
 */
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../config/config');
const { AppError } = require('./errorHandler');

// Gera um token JWT para o usuário
const signToken = (id) => {
  return jwt.sign(
    { id },
    config.auth.jwtSecret,
    { expiresIn: config.auth.jwtExpiresIn }
  );
};

// Cria e envia o token JWT na resposta
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  
  // Define cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + parseInt(config.auth.jwtExpiresIn) * 3600000
    ),
    httpOnly: true
  };
  
  // Secure cookie em produção
  if (config.server.env === 'production') cookieOptions.secure = true;
  
  // Remove a senha do output
  user.password = undefined;
  
  // Envia o token como cookie e no corpo da resposta
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// Middleware para proteger rotas
const protect = async (req, res, next) => {
  // 1) Obter o token e verificar se existe
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('Você não está logado! Por favor, faça login para obter acesso.', 401)
    );
  }

  // 2) Verificar se o token é válido
  try {
    const decoded = await promisify(jwt.verify)(token, config.auth.jwtSecret);

    // 3) Verificar se o usuário ainda existe (simulado para o MVP)
    // Em uma implementação real, você buscaria o usuário no banco de dados
    const currentUser = { id: decoded.id, role: 'user' };
    
    if (!currentUser) {
      return next(
        new AppError('O usuário pertencente a este token não existe mais.', 401)
      );
    }

    // 4) Verificar se o usuário alterou a senha após o token ser emitido
    // Implementação omitida para o MVP

    // Conceder acesso à rota protegida
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (error) {
    return next(
      new AppError('Autenticação inválida. Por favor, faça login novamente.', 401)
    );
  }
};

// Middleware para restringir acesso com base em roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'moderator']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('Você não tem permissão para realizar esta ação', 403)
      );
    }

    next();
  };
};

module.exports = {
  signToken,
  createSendToken,
  protect,
  restrictTo
};
