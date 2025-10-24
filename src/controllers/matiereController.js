const db = require('../config/db');

const MatiereController = {
  // 🔹 Récupérer les matières premières avec recherche et pagination
  getMatieres: (req, res) => {
    try {
      let { page = 1, search = '' } = req.query;
      page = parseInt(page, 10);
      if (isNaN(page) || page < 1) page = 1;

      const limit = 10;
      const offset = (page - 1) * limit;

      const matieres = db.prepare(`
        SELECT id, nom, quantite_actuelle, quantite_minimale,
               fournisseur_nom, fournisseur_prenom, fournisseur_email, fournisseur_telephone
        FROM matieres_premieres
        WHERE LOWER(nom) LIKE LOWER(?)
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `).all(`%${search.trim()}%`, limit, offset);

      const { total } = db.prepare(`
        SELECT COUNT(*) AS total
        FROM matieres_premieres
        WHERE LOWER(nom) LIKE LOWER(?)
      `).get(`%${search.trim()}%`);

      const totalPages = Math.ceil(total / limit);

      res.json({
        matieres,
        pagination: {
          page,
          total,
          totalPages,
          prevPage: page > 1 ? `/api/matieres?page=${page - 1}&search=${search}` : null,
          nextPage: page < totalPages ? `/api/matieres?page=${page + 1}&search=${search}` : null,
        },
      });
    } catch (err) {
      console.error('❌ Erreur getMatieres:', err.message);
      res.status(500).json({ error: 'Erreur serveur lors de la récupération des matières premières.' });
    }
  },

  // 🔹 Ajouter une matière première (nom unique)
  addMatiere: (req, res) => {
    try {
      const {
        nom,
        quantite_actuelle = 0,
        quantite_minimale = 0,
        fournisseur_nom,
        fournisseur_prenom,
        fournisseur_email,
        fournisseur_telephone,
      } = req.body;

      if (!nom?.trim()) return res.status(400).json({ error: 'Le nom de la matière est obligatoire.' });

      const exists = db.prepare('SELECT id FROM matieres_premieres WHERE LOWER(nom) = LOWER(?)').get(nom.trim());
      if (exists) return res.status(400).json({ error: `⚠️ La matière "${nom}" existe déjà.` });

      const stmt = db.prepare(`
        INSERT INTO matieres_premieres
        (nom, quantite_actuelle, quantite_minimale, fournisseur_nom, fournisseur_prenom, fournisseur_email, fournisseur_telephone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        nom.trim(),
        parseFloat(quantite_actuelle) || 0,
        parseFloat(quantite_minimale) || 0,
        fournisseur_nom?.trim() || null,
        fournisseur_prenom?.trim() || null,
        fournisseur_email?.trim() || null,
        fournisseur_telephone?.trim() || null
      );

      res.status(201).json({ message: '✅ Matière première ajoutée avec succès.', id: result.lastInsertRowid });
    } catch (err) {
      console.error('❌ Erreur addMatiere:', err.message);
      res.status(500).json({ error: 'Erreur serveur lors de l’ajout de la matière.' });
    }
  },

  // 🔹 Mettre à jour une matière première
  updateMatiere: (req, res) => {
    try {
      const { id } = req.params;
      const {
        nom,
        quantite_actuelle,
        quantite_minimale,
        fournisseur_nom,
        fournisseur_prenom,
        fournisseur_email,
        fournisseur_telephone,
      } = req.body;

      const old = db.prepare('SELECT * FROM matieres_premieres WHERE id = ?').get(id);
      if (!old) return res.status(404).json({ error: 'Matière première non trouvée.' });

      if (nom?.trim() && nom.trim().toLowerCase() !== old.nom.toLowerCase()) {
        const exists = db.prepare('SELECT id FROM matieres_premieres WHERE LOWER(nom) = LOWER(?)').get(nom.trim());
        if (exists) return res.status(400).json({ error: 'Une autre matière avec ce nom existe déjà.' });
      }

      const stmt = db.prepare(`
        UPDATE matieres_premieres
        SET nom = COALESCE(?, nom),
            quantite_actuelle = COALESCE(?, quantite_actuelle),
            quantite_minimale = COALESCE(?, quantite_minimale),
            fournisseur_nom = COALESCE(?, fournisseur_nom),
            fournisseur_prenom = COALESCE(?, fournisseur_prenom),
            fournisseur_email = COALESCE(?, fournisseur_email),
            fournisseur_telephone = COALESCE(?, fournisseur_telephone)
        WHERE id = ?
      `);

      const result = stmt.run(
        nom?.trim() || null,
        quantite_actuelle !== undefined ? parseFloat(quantite_actuelle) : null,
        quantite_minimale !== undefined ? parseFloat(quantite_minimale) : null,
        fournisseur_nom?.trim() || null,
        fournisseur_prenom?.trim() || null,
        fournisseur_email?.trim() || null,
        fournisseur_telephone?.trim() || null,
        id
      );

      if (result.changes === 0) return res.status(400).json({ error: 'Aucune mise à jour effectuée.' });
      res.json({ message: '✅ Matière première mise à jour avec succès.' });
    } catch (err) {
      console.error('❌ Erreur updateMatiere:', err.message);
      res.status(500).json({ error: 'Erreur serveur lors de la mise à jour.' });
    }
  },

  // 🔹 Supprimer une matière première
  deleteMatiere: (req, res) => {
    try {
      const { id } = req.params;
      const result = db.prepare('DELETE FROM matieres_premieres WHERE id = ?').run(id);
      if (result.changes === 0) return res.status(404).json({ error: 'Matière première non trouvée.' });
      res.json({ message: '🗑️ Matière première supprimée avec succès.' });
    } catch (err) {
      console.error('❌ Erreur deleteMatiere:', err.message);
      res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
    }
  },

  // 🔹 Ajouter du stock
  addStock: (req, res) => {
    try {
      const { id } = req.params;
      const quantity = parseFloat(req.body.value);
      if (!quantity || quantity <= 0) return res.status(400).json({ error: 'Quantité invalide.' });

      const matiere = db.prepare('SELECT * FROM matieres_premieres WHERE id = ?').get(id);
      if (!matiere) return res.status(404).json({ error: 'Matière première non trouvée.' });

      db.prepare('UPDATE matieres_premieres SET quantite_actuelle = quantite_actuelle + ? WHERE id = ?').run(quantity, id);
      res.json({ message: '✅ Stock ajouté avec succès.' });
    } catch (err) {
      console.error('❌ Erreur addStock:', err.message);
      res.status(500).json({ error: 'Erreur serveur lors de l’ajout de stock.' });
    }
  },

  // 🔹 Consommer du stock
  consommerMatiere: (req, res) => {
    try {
      const { id } = req.params;
      const quantity = parseFloat(req.body.value);
      if (!quantity || quantity <= 0) return res.status(400).json({ error: 'Quantité invalide.' });

      const matiere = db.prepare('SELECT * FROM matieres_premieres WHERE id = ?').get(id);
      if (!matiere) return res.status(404).json({ error: 'Matière première non trouvée.' });
      if (matiere.quantite_actuelle < quantity) return res.status(400).json({ error: 'Stock insuffisant.' });

      // Mettre à jour le stock
      db.prepare('UPDATE matieres_premieres SET quantite_actuelle = quantite_actuelle - ? WHERE id = ?').run(quantity, id);

      // Insérer dans la table consommation avec date actuelle SQLite
      db.prepare(`
        INSERT INTO consommation (matiere_id, quantite_utilisee, date_consommation)
        VALUES (?, ?, datetime('now', 'localtime'))
      `).run(id, quantity);

      res.json({ message: '✅ Consommation enregistrée et stock mis à jour.' });
    } catch (err) {
      console.error('❌ Erreur consommerMatiere:', err.message);
      res.status(500).json({ error: 'Erreur serveur lors de la consommation.' });
    }
  }
};

module.exports = MatiereController;
