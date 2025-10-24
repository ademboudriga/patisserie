const ProduitModel = require('../models/produitModel');

class ProduitController {

  // 🔹 Récupérer un produit par ID
  static getById(req, res) {
    try {
      const produit = ProduitModel.getById(req.params.id);
      res.status(200).json(produit);
    } catch (err) {
      console.error('Erreur getById:', err);
      res.status(404).json({ error: err.message });
    }
  }

  // 🔹 Récupérer tous les produits avec pagination et recherche
  static getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const produits = ProduitModel.getAll(page, limit, search);
      const total = ProduitModel.getTotalCount(search);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        produits,
        pagination: { page, limit, total, totalPages }
      });
    } catch (err) {
      console.error('Erreur getAll:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // 🔹 Créer un nouveau produit
  static create(req, res) {
    try {
      const produit = ProduitModel.create(req.body);
      res.status(201).json({
        message: 'Produit créé avec succès',
        produit
      });
    } catch (err) {
      console.error('Erreur create:', err);
      let status = 400;
      if (err.message === 'Nom de produit déjà existant') status = 409;
      if (err.message.includes('Prix invalide') || err.message.includes('Quantités invalides')) status = 400;
      res.status(status).json({ error: err.message });
    }
  }

  // 🔹 Mettre à jour un produit par ID
  static update(req, res) {
    try {
      const produit = ProduitModel.update(req.params.id, req.body);
      res.status(200).json({
        message: 'Produit mis à jour avec succès',
        produit
      });
    } catch (err) {
      console.error('Erreur update:', err);
      let status = 400;
      if (err.message === 'Produit introuvable') status = 404;
      if (err.message === 'Nom de produit déjà existant') status = 409;
      if (err.message.includes('Prix invalide') || err.message.includes('Quantité') || err.message.includes('invalide')) status = 400;
      res.status(status).json({ error: err.message });
    }
  }

  // 🔹 Supprimer un produit par ID
  static delete(req, res) {
    try {
      const success = ProduitModel.delete(req.params.id);
      if (!success) return res.status(404).json({ error: 'Produit introuvable' });
      res.status(200).json({ message: 'Produit supprimé avec succès' });
    } catch (err) {
      console.error('Erreur delete:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // 🔹 Consommer de la vitrine (enregistre la vente et met à jour)
  static consume(req, res) {
    try {
      const { id } = req.params;
      const { quantite } = req.body;
      if (!quantite || isNaN(quantite) || parseInt(quantite) <= 0) {
        return res.status(400).json({ error: 'Quantité à consommer invalide' });
      }
      const result = ProduitModel.consumeFromVitrine(id, parseInt(quantite));
      res.status(200).json({
        message: 'Vente (consommation) enregistrée avec succès',
        vente: result
      });
    } catch (err) {
      console.error('Erreur consume:', err);
      let status = 400;
      if (err.message.includes('Produit introuvable')) status = 404;
      if (err.message.includes('invalide') || err.message.includes('dépassé')) status = 400;
      res.status(status).json({ error: err.message });
    }
  }
}

module.exports = ProduitController;