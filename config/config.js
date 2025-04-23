/**
 * Configuração centralizada da aplicação
 * Gerencia variáveis sensíveis como credenciais e configurações de ambiente
 */
require('dotenv').config();

module.exports = {
  // Configurações do servidor
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  
  // Configurações de autenticação
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'sua_chave_secreta_jwt',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  
  // Configurações de log
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'app.log',
  },
  
  // Configurações de banco de dados (simulado para o MVP)
  database: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/mvp_architecture',
  },
  
  // Configurações de monitoramento
  monitoring: {
    enabled: process.env.MONITORING_ENABLED || true,
  }
};
