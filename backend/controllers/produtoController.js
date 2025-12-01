// backend/controllers/produtoController.js
const db = require('../database');
const path = require('path');
const fs = require('fs');

// 📌 Listar produtos
exports.listarProdutos = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.idproduto, p.nomeproduto, p.precounitario, p.descricao, 
                   p.idcategoria, c.nomecategoria,
                   p.imagem
            FROM produto p
            LEFT JOIN categoria c ON p.idcategoria = c.idcategoria
            ORDER BY p.idproduto
        `);

        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao listar produtos:", err);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
};

// 📌 Criar produto
exports.criarProduto = async (req, res) => {
    try {
        const { nomeproduto, precounitario, descricao, idcategoria } = req.body;

        if (!nomeproduto || !precounitario) {
            return res.status(400).json({ error: "Nome e preço são obrigatórios" });
        }

        // 1. Criar produto sem imagem
        const result = await db.query(
            `INSERT INTO produto (nomeproduto, precounitario, descricao, idcategoria)
             VALUES ($1,$2,$3,$4) RETURNING *`,
            [nomeproduto, precounitario, descricao || null, idcategoria || null]
        );

        const produto = result.rows[0];
        let caminhoImagem = null;

        // 2. Se enviou arquivo
        if (req.file) {
            const ext = path.extname(req.file.originalname) || ".jpg";
            const novoNome = `${produto.idproduto}${ext}`;
            const pasta = path.join(__dirname, "../../frontend/imgs");
            const novoCaminho = path.join(pasta, novoNome);

            fs.renameSync(req.file.path, novoCaminho);

            caminhoImagem = `imgs/${novoNome}`;

            await db.query(
                "UPDATE produto SET imagem=$1 WHERE idproduto=$2",
                [caminhoImagem, produto.idproduto]
            );

            produto.imagem = caminhoImagem;
        }

        res.status(201).json(produto);

    } catch (err) {
        console.error("Erro ao criar produto:", err);
        res.status(500).json({ error: "Erro ao criar produto" });
    }
};

// 📌 Obter produto
exports.obterProduto = async (req, res) => {
    try {
        const id = req.params.id;

        const result = await db.query(
            `SELECT p.*, c.nomecategoria 
             FROM produto p 
             LEFT JOIN categoria c ON c.idcategoria=p.idcategoria
             WHERE idproduto=$1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Produto não encontrado" });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Erro ao obter produto:", err);
        res.status(500).json({ error: "Erro ao obter produto" });
    }
};

// 📌 Atualizar produto
exports.atualizarProduto = async (req, res) => {
    try {
        const id = req.params.id;

        const produtoExistente = await db.query("SELECT * FROM produto WHERE idproduto=$1", [id]);
        if (produtoExistente.rows.length === 0) {
            return res.status(404).json({ error: "Produto não encontrado" });
        }

        const atual = produtoExistente.rows[0];

        const nome = req.body.nomeproduto || atual.nomeproduto;
        const preco = req.body.precounitario || atual.precounitario;
        const desc = req.body.descricao ?? atual.descricao;
        const categoria = req.body.idcategoria || atual.idcategoria;

        let caminho = atual.imagem;

        // Se veio nova imagem
        if (req.file) {
            const ext = path.extname(req.file.originalname) || ".jpg";
            const novoNome = `${id}${ext}`;
            const pasta = path.join(__dirname, "../../frontend/imgs");
            const novoCaminho = path.join(pasta, novoNome);

            // Apagar imagem antiga
            if (atual.imagem) {
                const imgVelha = path.join(pasta, path.basename(atual.imagem));
                if (fs.existsSync(imgVelha)) fs.unlinkSync(imgVelha);
            }

            fs.renameSync(req.file.path, novoCaminho);

            caminho = `imgs/${novoNome}`;
        }

        const result = await db.query(
            `UPDATE produto SET 
                nomeproduto=$1, precounitario=$2, descricao=$3, 
                idcategoria=$4, imagem=$5 
             WHERE idproduto=$6
             RETURNING *`,
            [nome, preco, desc, categoria, caminho, id]
        );

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Erro ao atualizar produto:", err);
        res.status(500).json({ error: "Erro ao atualizar produto" });
    }
};

// 📌 Deletar produto
exports.deletarProduto = async (req, res) => {
    try {
        const id = req.params.id;

        const produto = await db.query("SELECT * FROM produto WHERE idproduto=$1", [id]);

        if (produto.rows.length > 0 && produto.rows[0].imagem) {
            const pasta = path.join(__dirname, "../../frontend/imgs");
            const img = path.join(pasta, path.basename(produto.rows[0].imagem));
            if (fs.existsSync(img)) fs.unlinkSync(img);
        }

        await db.query("DELETE FROM produto WHERE idproduto=$1", [id]);

        res.json({ status: "ok", mensagem: "Produto deletado" });

    } catch (err) {
        console.error("Erro ao deletar produto:", err);
        res.status(500).json({ error: "Erro ao deletar produto" });
    }
};
