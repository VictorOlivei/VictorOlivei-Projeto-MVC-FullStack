/**
 * Configuração principal de rotas
 * Integra todas as rotas da aplicação
 */
const express = require('express');
const authRoutes = require('./authRoutes');
const logRoutes = require('./logRoutes');
const healthRoutes = require('./healthRoutes');

const router = express.Router();

// Rotas de autenticação
router.use('/auth', authRoutes);

// Rotas de logs
router.use('/logs', logRoutes);

// Rotas de saúde
router.use('/health', healthRoutes);

module.exports = router;
