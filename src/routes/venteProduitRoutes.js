// src/routes/venteProduitRoutes.js
const express = require('express');
const router = express.Router();
const VenteProduitController = require('../controllers/VenteProduitController');


router.get('/', VenteProduitController.getAll);
router.get('/totaux', VenteProduitController.getTotalParJour); // ⛔ Erreur ici

module.exports = router;
