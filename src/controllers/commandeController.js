// 📁 src/controllers/CommandeController.js
const CommandeModel = require('../models/commandeModel');

class CommandeController {

  // 🔹 Récupérer une commande par ID
  static getById(req, res) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new Error('ID invalide');

      const commande = CommandeModel.getById(id);
      res.status(200).json(commande);
    } catch (err) {
      console.error('[DEBUG] Erreur getById:', err.message);
      res.status(404).json({ error: err.message });
    }
  }

  // 🔹 Récupérer toutes les commandes avec recherche et pagination
  static getAll(req, res) {
    try {
      const { search = '', page = 1, limit = 10 } = req.query;

      const result = CommandeModel.getAll({
        search: search.toString(),
        page: Number(page),
        limit: Number(limit)
      });

      res.status(200).json(result);
    } catch (err) {
      console.error('[DEBUG] Erreur getAll:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  // 🔹 Créer une nouvelle commande
  static create(req, res) {
    try {
      console.log('[DEBUG] Route POST /api/commandes hit:', req.body);

      const data = {
        ...req.body,
        longueur: Number(req.body.longueur),
        largeur: Number(req.body.largeur),
        nombre_etages: Number(req.body.nombre_etages || 1),
        prix: Number(req.body.prix),
        accompte: Number(req.body.accompte || 0),
        date_livraison: new Date(req.body.date_livraison).toISOString(),
      };

      const commande = CommandeModel.create(data);
      res.status(201).json({
        message: 'Commande créée avec succès',
        commande,
      });
    } catch (err) {
      console.error('[DEBUG] Erreur create:', err.message);
      res.status(400).json({ error: err.message });
    }
  }

  // 🔹 Mettre à jour une commande par ID
  static update(req, res) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new Error('ID invalide');

      console.log(`[DEBUG] Route PUT /api/commandes/${id} hit`, req.body);

      const data = { ...req.body };
      if (data.longueur !== undefined) data.longueur = Number(data.longueur);
      if (data.largeur !== undefined) data.largeur = Number(data.largeur);
      if (data.nombre_etages !== undefined) data.nombre_etages = Number(data.nombre_etages);
      if (data.prix !== undefined) data.prix = Number(data.prix);
      if (data.accompte !== undefined) data.accompte = Number(data.accompte);
      if (data.date_livraison !== undefined) data.date_livraison = new Date(data.date_livraison).toISOString();

      const commande = CommandeModel.update(id, data);
      res.status(200).json({
        message: 'Commande mise à jour avec succès',
        commande,
      });
    } catch (err) {
      console.error('[DEBUG] Erreur update:', err.message);
      const status = err.message.includes('introuvable') ? 404 : 400;
      res.status(status).json({ error: err.message });
    }
  }

  // 🔹 Supprimer une commande par ID
  static delete(req, res) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new Error('ID invalide');

      console.log(`[DEBUG] Route DELETE /api/commandes/${id} hit`);
      const success = CommandeModel.delete(id);
      if (!success) return res.status(404).json({ error: 'Commande introuvable' });

      res.status(200).json({ message: 'Commande supprimée avec succès' });
    } catch (err) {
      console.error('[DEBUG] Erreur delete:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = CommandeController;
