/**
 * Rotas de autenticação
 * Define endpoints para login e gerenciamento de usuários
 */
const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Rota de login
router.post('/login', authController.login);

// Rota protegida para obter perfil do usuário atual
router.get('/me', protect, authController.getMe);

module.exports = router;
