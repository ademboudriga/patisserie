// 📁 src/routes/FactureRoutes.js
const express = require('express');
const FactureController = require('../controllers/FactureController');

const router = express.Router();

// === Routes pour les factures ===

// GET /api/factures - Récupérer toutes les factures avec filtres et pagination
router.get('/', FactureController.getAllFactures);

// GET /api/factures/print - Récupérer les factures pour impression par client et période
router.get('/print', FactureController.getFacturesForPrint);

// GET /api/factures/:id - Récupérer une facture par ID (avec ses produits)
router.get('/:id', FactureController.getFactureById);

// POST /api/factures - Créer une nouvelle facture
router.post('/', FactureController.createFacture);

// PUT /api/factures/:id - Mettre à jour une facture
router.put('/:id', FactureController.updateFacture);

// DELETE /api/factures/:id - Supprimer une facture
router.delete('/:id', FactureController.deleteFacture);

// === Routes pour les produits des factures ===

// POST /api/factures/:id/produits - Ajouter un produit à une facture
router.post('/:id/produits', FactureController.addProduitToFacture);

// GET /api/factures/:id/produits - Récupérer les produits d'une facture
router.get('/:id/produits', FactureController.getProduitsByFactureId);

// DELETE /api/factures/produits/:produitId - Supprimer un produit d'une facture
router.delete('/produits/:produitId', FactureController.deleteProduitFromFacture);

module.exports = router;