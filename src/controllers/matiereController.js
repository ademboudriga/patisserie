// 📁 src/controllers/MatiereController.js
const db = require('../config/db');  // Gardé pour le log de consommation (spécifique)
const MatierePremiere = require('../models/matiereModel');

const MatiereController = {
  // 🔹 Récupérer les matières premières avec recherche et pagination (utilise le modèle)
  getMatieres: (req, res) => {
    try {
      let { page = 1, search = '' } = req.query;
      page = parseInt(page, 10);
      if (isNaN(page) || page < 1) page = 1;

      const limit = 10;
      const offset = (page - 1) * limit;

      const { matieres, total, pages } = MatierePremiere.getAll(limit, offset, search.trim());

      res.json({
        matieres,  // Inclut déjà quantite_actuelle_unites et quantite_minimale_unites
        pagination: {
          page,
          total,
          totalPages: pages,
          prevPage: page > 1 ? `/api/matieres?page=${page - 1}&search=${search}` : null,
          nextPage: page < pages ? `/api/matieres?page=${page + 1}&search=${search}` : null,
        },
      });
    } catch (err) {
      console.error('❌ Erreur getMatieres:', err.message);
      res.status(500).json({ error: 'Erreur serveur lors de la récupération des matières premières.' });
    }
  },

  // 🔹 Ajouter une matière première (unité obligatoire, nom unique)
  addMatiere: async (req, res) => {
    try {
      const {
        nom,
        quantite_actuelle = 0,
        quantite_minimale = 0,
        unite = 'kg',  // Par défaut kg
        fournisseur_nom,
        fournisseur_prenom,
        fournisseur_email,
        fournisseur_telephone,
      } = req.body;

      if (!nom?.trim()) return res.status(400).json({ error: 'Le nom de la matière est obligatoire.' });
      if (!['kg', 'sack20', 'sack50'].includes(unite)) {
        return res.status(400).json({ error: 'Unité invalide. Choisissez : kg, sack20 ou sack50.' });
      }

      // Utilise le modèle pour création + conversion
      const nouvelleMatiere = MatierePremiere.create(
        nom.trim(),
        parseFloat(quantite_actuelle) || 0,
        parseFloat(quantite_minimale) || 0,
        unite,
        fournisseur_nom?.trim() || null,
        fournisseur_prenom?.trim() || null,
        fournisseur_email?.trim() || null,
        fournisseur_telephone?.trim() || null
      );

      res.status(201).json({ 
        message: '✅ Matière première ajoutée avec succès.', 
        matiere: nouvelleMatiere  // Inclut unités converties
      });
    } catch (err) {
      console.error('❌ Erreur addMatiere:', err.message);
      res.status(400).json({ error: err.message });  // 400 pour validations du modèle
    }
  },

  // 🔹 Mettre à jour une matière première (unité modifiable)
  updateMatiere: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      if (data.unite && !['kg', 'sack20', 'sack50'].includes(data.unite)) {
        return res.status(400).json({ error: 'Unité invalide. Choisissez : kg, sack20 ou sack50.' });
      }

      // Utilise le modèle (gère reconversion si unité changée)
      const matiereUpdatee = MatierePremiere.update(id, data);

      res.json({ 
        message: '✅ Matière première mise à jour avec succès.', 
        matiere: matiereUpdatee 
      });
    } catch (err) {
      console.error('❌ Erreur updateMatiere:', err.message);
      res.status(400).json({ error: err.message });
    }
  },

  // 🔹 Supprimer une matière première
  deleteMatiere: (req, res) => {
    try {
      const { id } = req.params;
      MatierePremiere.delete(id);  // Utilise le modèle
      res.json({ message: '🗑️ Matière première supprimée avec succès.' });
    } catch (err) {
      console.error('❌ Erreur deleteMatiere:', err.message);
      res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
    }
  },

  // 🔹 Ajouter du stock (quantité en unités)
  addStock: (req, res) => {
    try {
      const { id } = req.params;
      const { value, unite } = req.body;  // value en unités, unite optionnelle
      const quantity = parseFloat(value);
      if (!quantity || quantity <= 0) return res.status(400).json({ error: 'Quantité invalide (doit être > 0).' });

      // Utilise le modèle pour mise à jour + conversion
      MatierePremiere.updateQuantite(id, quantity, unite);
      res.json({ message: `✅ ${quantity} ${unite || 'unités'} ajoutées au stock.` });
    } catch (err) {
      console.error('❌ Erreur addStock:', err.message);
      res.status(400).json({ error: err.message });
    }
  },

  // 🔹 Consommer du stock (quantité en unités)
  consommerMatiere: (req, res) => {
    try {
      const { id } = req.params;
      const { value, unite } = req.body;
      const quantity = parseFloat(value);
      if (!quantity || quantity <= 0) return res.status(400).json({ error: 'Quantité invalide (doit être > 0).' });

      const matiere = MatierePremiere.getById(id);
      if (!matiere) return res.status(404).json({ error: 'Matière première non trouvée.' });

      const uniteFinale = unite || matiere.unite;
      const kgAConsommer = MatierePremiere.convertirEnKg(quantity, uniteFinale);
      if (matiere.quantite_actuelle < kgAConsommer) {
        return res.status(400).json({ 
          error: `Stock insuffisant. Disponible : ${matiere.quantite_actuelle} kg (besoin : ${kgAConsommer} kg).` 
        });
      }

      // Mise à jour stock (négatif pour soustraire)
      MatierePremiere.updateQuantite(id, -quantity, uniteFinale);

      // Log consommation en kg (gardé direct pour simplicité)
      db.prepare(`
        INSERT INTO consommation (matiere_id, quantite_utilisee, date_consommation)
        VALUES (?, ?, datetime('now', 'localtime'))
      `).run(id, kgAConsommer);

      res.json({ message: `✅ ${quantity} ${uniteFinale} consommées (soit ${kgAConsommer} kg).` });
    } catch (err) {
      console.error('❌ Erreur consommerMatiere:', err.message);
      res.status(400).json({ error: err.message });
    }
  }
};

module.exports = MatiereController;