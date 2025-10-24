const express = require('express');
const ProduitController = require('../controllers/produitController');

const router = express.Router();

// 🔹 Routes pour les produits
router.get('/', ProduitController.getAll);
router.get('/:id', ProduitController.getById);
router.post('/', ProduitController.create);
router.put('/:id', ProduitController.update);
router.delete('/:id', ProduitController.delete);
router.post('/:id/consume', ProduitController.consume);  // Nouvelle route pour consommer

module.exports = router;