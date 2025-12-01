// backend/routes/produtoRoutes.js
const express = require("express");
const router = express.Router();
const produtoController = require("../controllers/produtoController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Pasta de imagens
const pastaImgs = path.join(__dirname, "../../frontend/imgs");
if (!fs.existsSync(pastaImgs)) {
    fs.mkdirSync(pastaImgs, { recursive: true });
}

// Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, pastaImgs),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});

const upload = multer({ storage });

// Rotas
router.get("/", produtoController.listarProdutos);
router.get("/:id", produtoController.obterProduto);
router.post("/", upload.single("imagem"), produtoController.criarProduto);
router.put("/:id", upload.single("imagem"), produtoController.atualizarProduto);
router.delete("/:id", produtoController.deletarProduto);

module.exports = router;
