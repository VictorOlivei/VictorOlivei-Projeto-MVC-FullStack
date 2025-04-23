/**
 * Arquivo de inicialização do servidor
 * Configura e inicia o servidor Express
 */
const app = require('./app');
const config = require('./config/config');
const logger = require('./utils/logger');

// Definir porta
const port = config.server.port;

// Iniciar servidor
const server = app.listen(port, () => {
  logger.info(`Servidor rodando em modo ${config.server.env} na porta ${port}`);
});

// Tratamento de exceções não capturadas
process.on('uncaughtException', err => {
  logger.error('EXCEÇÃO NÃO CAPTURADA! 💥 Encerrando...');
  logger.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Tratamento de rejeições não tratadas
process.on('unhandledRejection', err => {
  logger.error('REJEIÇÃO NÃO TRATADA! 💥 Encerrando...');
  logger.error(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});

// Tratamento de sinais de término
process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEBIDO. Encerrando graciosamente');
  server.close(() => {
    logger.info('Processo encerrado!');
  });
});
