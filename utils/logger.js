/**
 * Sistema de log estruturado
 * Salva logs de requisições, erros e eventos importantes em arquivos ou banco de dados
 */
const winston = require('winston');
const config = require('../config/config');

// Formato personalizado para os logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Criação do logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'mvp-architecture' },
  transports: [
    // Salva logs de erro em error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Salva todos os logs em app.log
    new winston.transports.File({ 
      filename: 'logs/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Salva logs de segurança em arquivo separado
    new winston.transports.File({ 
      filename: 'logs/security.log', 
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Salva logs de acesso em arquivo separado
    new winston.transports.File({ 
      filename: 'logs/access.log', 
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
      ),
    }),
  ],
});

// Adiciona console transport em ambiente de desenvolvimento
if (config.server.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// Função para registrar requisições HTTP
logger.logRequest = (req, res, next) => {
  const start = Date.now();
  const requestId = generateRequestId();
  
  // Adiciona ID da requisição para rastreamento
  req.requestId = requestId;
  
  // Log inicial da requisição
  logger.info({
    type: 'request_start',
    requestId,
    method: req.method,
    url: req.originalUrl,
    params: sanitizeData(req.params),
    query: sanitizeData(req.query),
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });
  
  // Quando a resposta terminar
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel]({
      type: 'request_end',
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user ? req.user.id : 'anonymous',
      timestamp: new Date().toISOString()
    });
    
    // Registrar eventos de autenticação
    if (req.originalUrl.includes('/auth/login')) {
      logger.info({
        type: 'auth_attempt',
        requestId,
        success: res.statusCode === 200,
        ip: req.ip,
        email: sanitizeEmail(req.body.email),
        timestamp: new Date().toISOString()
      });
    }
    
    // Registrar eventos de acesso a recursos protegidos
    if (req.user && res.statusCode === 200) {
      logger.info({
        type: 'resource_access',
        requestId,
        userId: req.user.id,
        resource: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }
    
    // Registrar eventos de erro no cliente (4xx)
    if (res.statusCode >= 400 && res.statusCode < 500) {
      logger.warn({
        type: 'client_error',
        requestId,
        status: res.statusCode,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: req.user ? req.user.id : 'anonymous',
        timestamp: new Date().toISOString()
      });
    }
    
    // Registrar eventos de erro no servidor (5xx)
    if (res.statusCode >= 500) {
      logger.error({
        type: 'server_error',
        requestId,
        status: res.statusCode,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  next();
};

// Função para registrar erros
logger.logError = (err, req, res, next) => {
  const requestId = req.requestId || generateRequestId();
  
  logger.error({
    type: 'error',
    requestId,
    message: err.message,
    stack: err.stack,
    code: err.code,
    statusCode: err.statusCode,
    method: req.method,
    url: req.originalUrl,
    params: sanitizeData(req.params),
    query: sanitizeData(req.query),
    ip: req.ip,
    userId: req.user ? req.user.id : 'anonymous',
    timestamp: new Date().toISOString()
  });
  
  next(err);
};

// Função para registrar eventos de segurança
logger.logSecurity = (type, data) => {
  logger.warn({
    type: `security_${type}`,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Função para registrar eventos de negócio
logger.logBusinessEvent = (event, data) => {
  logger.info({
    type: `business_${event}`,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Função para gerar ID único para requisições (para correlação)
function generateRequestId() {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Função para sanitizar dados sensíveis antes de registrar
function sanitizeData(data) {
  if (!data) return {};
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'authorization', 'creditCard'];
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

// Função para sanitizar emails em logs
function sanitizeEmail(email) {
  if (!email) return 'unknown';
  const parts = email.split('@');
  if (parts.length !== 2) return 'invalid-email';
  
  // Mostra apenas os primeiros caracteres do email
  return `${parts[0].substr(0, 3)}***@${parts[1]}`;
}

module.exports = logger;
