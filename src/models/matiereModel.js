// 📁 src/models/MatierePremiere.js
const db = require('../config/db');

class MatierePremiere {
  // 🔍 Recherche par nom
  static searchByName(name) {
    const query = `
      SELECT * FROM matieres_premieres
      WHERE nom LIKE ?
      ORDER BY id DESC
    `;
    return db.prepare(query).all(`%${name}%`);
  }

  // ➕ Création d'une nouvelle matière première (nom unique, fournisseur optionnel)
  static create(nom, quantite_actuelle = 0, quantite_minimale = 0, fournisseur_nom = null, fournisseur_prenom = null, fournisseur_email = null, fournisseur_telephone = null) {
    // Vérifier que le nom n’existe pas déjà
    const existing = db.prepare(`SELECT id FROM matieres_premieres WHERE nom = ?`).get(nom.trim());
    if (existing) {
      throw new Error('Une matière avec ce nom existe déjà.');
    }

    const stmt = db.prepare(`
      INSERT INTO matieres_premieres (
        nom, 
        quantite_actuelle, 
        quantite_minimale, 
        fournisseur_nom, 
        fournisseur_prenom, 
        fournisseur_email, 
        fournisseur_telephone
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      nom.trim(),
      quantite_actuelle,
      quantite_minimale,
      fournisseur_nom?.trim() || null,
      fournisseur_prenom?.trim() || null,
      fournisseur_email?.trim() || null,
      fournisseur_telephone?.trim() || null
    );

    return this.getById(info.lastInsertRowid);
  }

  // 📜 Récupérer toutes les matières premières
  static getAll(limit = 10, offset = 0, search = '') {
    const query = `
      SELECT *
      FROM matieres_premieres
      WHERE nom LIKE ?
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;
    const matieres = db.prepare(query).all(`%${search}%`, limit, offset);

    const totalQuery = `
      SELECT COUNT(*) AS count
      FROM matieres_premieres
      WHERE nom LIKE ?
    `;
    const total = db.prepare(totalQuery).get(`%${search}%`).count;

    return {
      matieres,
      total,
      pages: Math.ceil(total / limit)
    };
  }

  // 🔍 Récupérer une matière première par ID
  static getById(id) {
    return db.prepare(`SELECT * FROM matieres_premieres WHERE id = ?`).get(id);
  }

  // ✏️ Mettre à jour les infos d’une matière
  static update(id, data) {
    const matiere = this.getById(id);
    if (!matiere) throw new Error('Matière non trouvée.');

    // Vérifier si le nom est modifié et déjà existant
    if (data.nom && data.nom.trim() !== matiere.nom) {
      const exists = db.prepare('SELECT id FROM matieres_premieres WHERE nom = ?').get(data.nom.trim());
      if (exists) throw new Error('Une autre matière avec ce nom existe déjà.');
    }

    const stmt = db.prepare(`
      UPDATE matieres_premieres
      SET 
        nom = COALESCE(?, nom),
        quantite_actuelle = COALESCE(?, quantite_actuelle),
        quantite_minimale = COALESCE(?, quantite_minimale),
        fournisseur_nom = COALESCE(?, fournisseur_nom),
        fournisseur_prenom = COALESCE(?, fournisseur_prenom),
        fournisseur_email = COALESCE(?, fournisseur_email),
        fournisseur_telephone = COALESCE(?, fournisseur_telephone)
      WHERE id = ?
    `);

    stmt.run(
      data.nom?.trim() || null,
      data.quantite_actuelle ?? null,
      data.quantite_minimale ?? null,
      data.fournisseur_nom?.trim() || null,
      data.fournisseur_prenom?.trim() || null,
      data.fournisseur_email?.trim() || null,
      data.fournisseur_telephone?.trim() || null,
      id
    );

    return this.getById(id);
  }

  // 📦 Mise à jour de la quantité actuelle
  static updateQuantite(id, quantite_actuelle) {
    return db.prepare(`
      UPDATE matieres_premieres 
      SET quantite_actuelle = ? 
      WHERE id = ?
    `).run(quantite_actuelle, id);
  }

  // ❌ Supprimer une matière première
  static delete(id) {
    return db.prepare(`DELETE FROM matieres_premieres WHERE id = ?`).run(id);
  }
}

module.exports = MatierePremiere;
