const express = require('express');
const router = express.Router();
const controller = require('../controller/ElectionController');

// Rota inicial que renderiza a view index.ejs
router.get('/', controller.getIndex);

// Rotas da Eleição
router.post('/votar', controller.registerVote); // Renderiza View

module.exports = router;