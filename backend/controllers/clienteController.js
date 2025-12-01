const { query } = require('../database');
const path = require('path');

// Abre o CRUD (carregará o cliente.html que você vai enviar depois)
exports.abrirCrudCliente = (req, res) => {
  console.log('clienteController - abrirCrudCliente');
  res.sendFile(path.join(__dirname, '../../frontend/cliente/cliente.html'));
};

// LISTAR TODOS OS CLIENTES
exports.listarClientes = async (req, res) => {
  try {
    const sql = `
      SELECT c.idcliente,
             c.idusuario,
             u.nomeusuario,
             c.datacadastrocliente
      FROM cliente c
      JOIN usuario u ON u.idusuario = c.idusuario
      ORDER BY c.idcliente;
    `;

    const result = await query(sql);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// CRIAR CLIENTE
exports.criarCliente = async (req, res) => {
  try {
    const { idusuario, datacadastrocliente } = req.body;

    if (!idusuario) {
      return res.status(400).json({ error: 'O campo idusuario é obrigatório.' });
    }

    const sql = `
      INSERT INTO cliente (idusuario, datacadastrocliente)
      VALUES ($1, $2)
      RETURNING *;
    `;

    const result = await query(sql, [
      idusuario,
      datacadastrocliente || new Date()
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'O idusuario informado não existe na tabela usuario.'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// OBTER CLIENTE POR ID
exports.obterCliente = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const sql = `
      SELECT *
      FROM cliente
      WHERE idcliente = $1;
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao obter cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ATUALIZAR CLIENTE
exports.atualizarCliente = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { idusuario, datacadastrocliente } = req.body;

    const sql = `
      UPDATE cliente
      SET idusuario = $1,
          datacadastrocliente = $2
      WHERE idcliente = $3
      RETURNING *;
    `;

    const result = await query(sql, [
      idusuario,
      datacadastrocliente,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// DELETAR CLIENTE
exports.deletarCliente = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // verifica se existe
    const check = await query(
      'SELECT * FROM cliente WHERE idcliente = $1',
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    await query('DELETE FROM cliente WHERE idcliente = $1', [id]);

    res.status(204).send();

  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({
        error: 'Este cliente está vinculado a outras entidades e não pode ser excluído.'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
