const path = require('path');
const { query } = require('../database');

// =============================
//  ABRIR HTML
// =============================
exports.abrirCrudPagamento_has_formapagamento = (req, res) => {
  console.log('Abrindo CRUD pagamento_has_formapagamento');
  res.sendFile(path.join(__dirname, '../../frontend/pagamento_has_formapagamento/pagamento_has_formapagamento.html'));
};


// =============================
//  LISTAR
// =============================
exports.listar = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pagamento_has_formapagamento ORDER BY id_pagamento_res');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pagamento_has_formapagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};


// =============================
//  CRIAR
// =============================
exports.criar = async (req, res) => {
  try {
    const { id_pagamento, id_forma_pagamento, valor_pago } = req.body;

    if (!id_pagamento || !id_forma_pagamento || !valor_pago) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // calcula o próximo ID
    const maxIdResult = await query(
      'SELECT MAX(id_pagamento_res) AS max_id FROM pagamento_has_formapagamento'
    );
    const nextId = (maxIdResult.rows[0].max_id || 0) + 1;

    const result = await query(
      `INSERT INTO pagamento_has_formapagamento 
       (id_pagamento_res, id_pagamento, id_forma_pagamento, valor_pago)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nextId, id_pagamento, id_forma_pagamento, valor_pago]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao criar pagamento_has_formapagamento:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Chave estrangeira inválida (pagamento ou forma de pagamento inexistente)'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};


// =============================
//  OBTER POR ID
// =============================
exports.obter = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const result = await query(
      'SELECT * FROM pagamento_has_formapagamento WHERE id_pagamento_res = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao obter pagamento_has_formapagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};


// =============================
//  ATUALIZAR
// =============================
exports.atualizar = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { id_pagamento, id_forma_pagamento, valor_pago } = req.body;

    // verifica se existe
    const check = await query(
      'SELECT * FROM pagamento_has_formapagamento WHERE id_pagamento_res = $1',
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const current = check.rows[0];

    const result = await query(
      `UPDATE pagamento_has_formapagamento
       SET id_pagamento = $1,
           id_forma_pagamento = $2,
           valor_pago = $3
       WHERE id_pagamento_res = $4
       RETURNING *`,
      [
        id_pagamento ?? current.id_pagamento,
        id_forma_pagamento ?? current.id_forma_pagamento,
        valor_pago ?? current.valor_pago,
        id
      ]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao atualizar pagamento_has_formapagamento:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Chave estrangeira inválida (pagamento ou forma de pagamento inexistente)'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};


// =============================
//  DELETAR
// =============================
exports.deletar = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const check = await query(
      'SELECT * FROM pagamento_has_formapagamento WHERE id_pagamento_res = $1',
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    await query(
      'DELETE FROM pagamento_has_formapagamento WHERE id_pagamento_res = $1',
      [id]
    );

    res.status(204).send();

  } catch (error) {
    console.error('Erro ao deletar pagamento_has_formapagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
