// 📁 src/routes/commandeRoutes.js (updated)
const express = require('express');
const router = express.Router();
const CommandeController = require('../controllers/commandeController');

// 🔹 Récupérer toutes les commandes
router.get('/', CommandeController.getAll);

// 🔹 Récupérer les commandes à venir
router.get('/upcoming', CommandeController.getUpcoming);

// 🔹 Récupérer une commande par ID
router.get('/:id', CommandeController.getById);

// 🔹 Créer une commande
router.post('/', CommandeController.create);

// 🔹 Mettre à jour une commande
router.put('/:id', CommandeController.update);

// 🔹 Supprimer une commande
router.delete('/:id', CommandeController.delete);

module.exports = router;