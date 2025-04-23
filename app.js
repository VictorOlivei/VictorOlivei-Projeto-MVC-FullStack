/**
 * Arquivo principal da aplicação
 * Configura o servidor Express e integra todos os componentes
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Importar configurações e utilitários
const config = require('./config/config');
const logger = require('./utils/logger');
const { errorHandler } = require('./middlewares/errorHandler');
const { collectMetrics } = require('./middlewares/monitoringMiddleware');

// Importar rotas
const routes = require('./routes');

// Criar diretório de logs se não existir
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Inicializar aplicação Express
const app = express();

// Middlewares de segurança
app.use(helmet()); // Adiciona headers de segurança
app.use(cors()); // Habilita CORS

// Middleware de parsing
app.use(express.json({ limit: '10kb' })); // Parsing de JSON
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Parsing de URL-encoded

// Middleware de logging
app.use(logger.logRequest); // Logger personalizado
app.use(morgan('dev')); // Logger de desenvolvimento

// Middleware de monitoramento
app.use(collectMetrics);

// Rotas da API
app.use('/api/v1', routes);

// Rota raiz
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Bem-vindo à API de Arquitetura MVP',
    documentation: '/api/v1/docs',
    health: '/api/v1/health'
  });
});

// Middleware para rotas não encontradas
app.all('*', (req, res, next) => {
  const err = new Error(`Não foi possível encontrar ${req.originalUrl} neste servidor!`);
  err.status = 'fail';
  err.statusCode = 404;
  next(err);
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Exportar app para uso em server.js
module.exports = app;
