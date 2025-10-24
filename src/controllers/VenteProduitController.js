// 📁 src/controllers/venteProduitController.js
const VenteProduitModel = require('../models/venteProduitModel');

class VenteProduitController {
  // 🔹 Récupérer toutes les ventes
  static getAll(req, res) {
    try {
      const ventes = VenteProduitModel.getAll();
      res.status(200).json(ventes);
    } catch (err) {
      console.error('❌ Erreur dans VenteProduitController.getAll:', err);
      res.status(500).json({ error: 'Erreur lors du chargement des ventes.' });
    }
  }

  // 🔹 Récupérer le total des ventes par produit et par jour
  static getTotalParJour(req, res) {
    try {
      const totaux = VenteProduitModel.getTotalVenteParJour();
      res.status(200).json(totaux);
    } catch (err) {
      console.error('❌ Erreur dans VenteProduitController.getTotalParJour:', err);
      res.status(500).json({ error: 'Erreur lors du calcul du total des ventes par jour.' });
    }
  }
}

module.exports = VenteProduitController;
