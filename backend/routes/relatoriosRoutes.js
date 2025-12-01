const express = require('express');
const router = express.Router();
const controller = require('../controllers/relatoriosController');

// PRODUTOS MAIS VENDIDOS
router.get('/produtos-mais-vendidos', controller.produtosMaisVendidos);

// VENDAS MENSAIS
router.get('/vendas-mensais', controller.vendasMensais);

module.exports = router;
