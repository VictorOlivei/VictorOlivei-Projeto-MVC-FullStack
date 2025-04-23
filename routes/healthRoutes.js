/**
 * Rotas de saúde da aplicação
 * Define endpoints para monitoramento básico do sistema
 */
const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

// Rota para verificar a saúde da aplicação (pública)
router.get('/', healthController.checkHealth);

module.exports = router;
