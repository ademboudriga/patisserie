// 📁 src/routes/consommationRoutes.js
const express = require('express');
const router = express.Router();

const { getAllConsommations, searchConsommationsByDateAndNom } = require('../controllers/consommationController');

// Route principale: Récupère les consommations avec pagination et filtre optionnel par nom
// Utilisation: GET /api/consommations?nom=sucre&limit=10&offset=0&page=1
router.get('/', getAllConsommations);

// Route de recherche: Total des consommations par matière pour un jour spécifique (avec filtre nom optionnel)
// Utilisation: GET /api/consommations/search?date=YYYY-MM-DD&nom=sucre&limit=10&offset=0&page=1
router.get('/search', searchConsommationsByDateAndNom);

module.exports = router;