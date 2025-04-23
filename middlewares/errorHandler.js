/**
 * Middleware de tratamento de exceções
 * Centraliza erros e define mensagens amigáveis para falhas
 */
const logger = require('../utils/logger');

// Classe personalizada para erros da aplicação
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware para capturar erros em operações assíncronas
const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Middleware para tratar erros de validação do mongoose
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Dados inválidos. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Middleware para tratar erros de JWT
const handleJWTError = () => 
  new AppError('Token inválido. Por favor, faça login novamente.', 401);

const handleJWTExpiredError = () => 
  new AppError('Seu token expirou. Por favor, faça login novamente.', 401);

// Middleware para enviar erros em ambiente de desenvolvimento
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Middleware para enviar erros em ambiente de produção
const sendErrorProd = (err, res) => {
  // Erros operacionais, confiáveis: enviar mensagem para o cliente
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } 
  // Erros de programação ou desconhecidos: não vazar detalhes
  else {
    // Log do erro
    logger.error('ERRO 💥', err);

    // Enviar mensagem genérica
    res.status(500).json({
      status: 'error',
      message: 'Algo deu errado!'
    });
  }
};

// Middleware principal de tratamento de erros
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

module.exports = {
  AppError,
  catchAsync,
  errorHandler
};
