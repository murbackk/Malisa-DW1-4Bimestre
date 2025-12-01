const db = require('../database');

// =================================================================
// 📊 RELATÓRIO 1 — PRODUTOS MAIS VENDIDOS
// =================================================================
exports.produtosMaisVendidos = async (req, res) => {
    try {
        const { dataInicio, dataFim, limite = 10 } = req.query;

        let filtros = [];
        let params = [];

        if (dataInicio) {
            params.push(dataInicio);
            filtros.push(`p.datapedido >= $${params.length}::date`);
        }

        if (dataFim) {
            params.push(dataFim);
            filtros.push(`p.datapedido < ($${params.length}::date + INTERVAL '1 day')`);
        }

        const where = filtros.length > 0 ? `WHERE ${filtros.join(" AND ")}` : "";

        const sql = `
            SELECT 
                pr.idproduto,
                pr.nomeproduto AS nome,
                c.nomecategoria AS categoria,
                SUM(pp.quantidade) AS quantidade_vendida,
                SUM(pp.quantidade * pp.precounitario) AS valor_total_vendido,
                AVG(pp.precounitario) AS preco_medio_venda
            FROM pedidoproduto pp
            JOIN produto pr ON pr.idproduto = pp.idproduto
            LEFT JOIN categoria c ON c.idcategoria = pr.idcategoria
            JOIN pedido p ON p.idpedido = pp.idpedido
            ${where}
            GROUP BY pr.idproduto, pr.nomeproduto, c.nomecategoria
            ORDER BY valor_total_vendido DESC
            LIMIT $${params.length + 1}
        `;

        params.push(limite);

        const result = await db.query(sql, params);

        res.json({
            status: "success",
            data: result.rows
        });

    } catch (err) {
        console.error("Erro relatório produtos mais vendidos:", err);
        res.status(500).json({ status: "error", message: "Erro no relatório." });
    }
};



// =================================================================
// 📈 RELATÓRIO 2 — VENDAS MENSAIS
// =================================================================
exports.vendasMensais = async (req, res) => {
    try {
        const { ano, ordenar = "mes_numero", direcao = "asc" } = req.query;

        if (!ano) {
            return res.status(400).json({
                status: "error",
                message: "Ano é obrigatório."
            });
        }

        const sql = `
    SELECT
        EXTRACT(MONTH FROM p.datapedido) AS mes_numero,
        COUNT(p.idpedido) AS "quantidadePedidos",
        SUM(p.valortotal) AS "totalVendas",
        CASE 
            WHEN COUNT(p.idpedido) > 0 
            THEN SUM(p.valortotal) / COUNT(p.idpedido)
            ELSE 0
        END AS "ticketMedio"
    FROM pedido p
    WHERE EXTRACT(YEAR FROM p.datapedido) = $1
    GROUP BY mes_numero
    ORDER BY ${ordenar} ${direcao};
`;


        const result = await db.query(sql, [ano]);

        res.json({
            status: "success",
            data: result.rows
        });

    } catch (err) {
        console.error("Erro relatório vendas mensais:", err);
        res.status(500).json({ status: "error", message: "Erro no relatório." });
    }
};
