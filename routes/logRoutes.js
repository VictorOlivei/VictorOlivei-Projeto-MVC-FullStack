/**
 * Rotas de logs
 * Define endpoints para visualização e gerenciamento de logs
 */
const express = require('express');
const logController = require('../controllers/logController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Rota para obter logs (protegida e restrita a administradores)
router.get('/', protect, restrictTo('admin'), logController.getLogs);

module.exports = router;
