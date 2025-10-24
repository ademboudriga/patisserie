const express = require('express');
const router = express.Router();
const MatiereController = require('../controllers/matiereController');

router.get('/', MatiereController.getMatieres); // ✅ correct
router.post('/', MatiereController.addMatiere); // ✅ correct
router.patch('/:id', MatiereController.updateMatiere); // ✅ correct
router.delete('/:id', MatiereController.deleteMatiere); // ✅ correct
router.post('/add-stock/:id', MatiereController.addStock); // ✅ correct
router.post('/consommer/:id', MatiereController.consommerMatiere); // ✅ correct

module.exports = router;
