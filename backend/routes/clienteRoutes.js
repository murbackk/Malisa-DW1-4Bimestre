const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// Rotas do CRUD Cliente
router.get('/abrirCrudCliente', clienteController.abrirCrudCliente);

router.get('/', clienteController.listarClientes);
router.post('/', clienteController.criarCliente);
router.get('/:id', clienteController.obterCliente);
router.put('/:id', clienteController.atualizarCliente);
router.delete('/:id', clienteController.deletarCliente);

module.exports = router;
