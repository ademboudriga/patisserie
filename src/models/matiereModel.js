// 📁 src/models/MatierePremiere.js
const db = require('../config/db');

// Facteurs de conversion (unité → kg)
const UNITE_FACTEURS = {
  'kg': 1,
  'sack20': 20,
  'sack50': 50
};

class MatierePremiere {
  // Vérification et conversion d'une quantité vers kg
  static convertirEnKg(quantite, unite) {
    if (!UNITE_FACTEURS[unite]) throw new Error(`Unité "${unite}" non supportée. Unités valides : ${Object.keys(UNITE_FACTEURS).join(', ')}`);
    return quantite * UNITE_FACTEURS[unite];
  }

  // Conversion inverse : kg vers unités
  static convertirEnUnites(kg, unite) {
    if (!UNITE_FACTEURS[unite]) throw new Error(`Unité "${unite}" non supportée.`);
    return kg / UNITE_FACTEURS[unite];
  }

  // 🔍 Recherche par nom
  static searchByName(name) {
    const query = `
      SELECT *, 
             (quantite_actuelle / ${UNITE_FACTEURS['kg']}) AS quantite_actuelle_unites,  -- kg est 1, mais pour uniformité
             (quantite_minimale / ${UNITE_FACTEURS['kg']}) AS quantite_minimale_unites
      FROM matieres_premieres
      WHERE nom LIKE ?
      ORDER BY id DESC
    `;
    return db.prepare(query).all(`%${name}%`);
  }

  // ➕ Création d'une nouvelle matière première (avec unité obligatoire)
  static create(nom, quantite_actuelle = 0, quantite_minimale = 0, unite = 'kg', fournisseur_nom = null, fournisseur_prenom = null, fournisseur_email = null, fournisseur_telephone = null) {
    // Vérifier que le nom n’existe pas déjà
    const existing = db.prepare(`SELECT id FROM matieres_premieres WHERE nom = ?`).get(nom.trim());
    if (existing) {
      throw new Error('Une matière avec ce nom existe déjà.');
    }

    // Valider et convertir unités
    const kgActuelle = this.convertirEnKg(quantite_actuelle, unite);
    const kgMinimale = this.convertirEnKg(quantite_minimale, unite);

    const stmt = db.prepare(`
      INSERT INTO matieres_premieres (
        nom, 
        quantite_actuelle, 
        quantite_minimale, 
        unite,
        fournisseur_nom, 
        fournisseur_prenom, 
        fournisseur_email, 
        fournisseur_telephone
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      nom.trim(),
      kgActuelle,
      kgMinimale,
      unite,
      fournisseur_nom?.trim() || null,
      fournisseur_prenom?.trim() || null,
      fournisseur_email?.trim() || null,
      fournisseur_telephone?.trim() || null
    );

    return this.getById(info.lastInsertRowid);
  }

  // 📜 Récupérer toutes les matières premières (avec conversion pour affichage)
  static getAll(limit = 10, offset = 0, search = '') {
    const query = `
      SELECT *, 
             quantite_actuelle / CASE unite 
               WHEN 'kg' THEN 1 
               WHEN 'sack20' THEN 20 
               WHEN 'sack50' THEN 50 
             END AS quantite_actuelle_unites,
             quantite_minimale / CASE unite 
               WHEN 'kg' THEN 1 
               WHEN 'sack20' THEN 20 
               WHEN 'sack50' THEN 50 
             END AS quantite_minimale_unites
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

  // 🔍 Récupérer une matière première par ID (avec conversion)
  static getById(id) {
    const matiere = db.prepare(`
      SELECT *, 
             quantite_actuelle / CASE unite 
               WHEN 'kg' THEN 1 
               WHEN 'sack20' THEN 20 
               WHEN 'sack50' THEN 50 
             END AS quantite_actuelle_unites,
             quantite_minimale / CASE unite 
               WHEN 'kg' THEN 1 
               WHEN 'sack20' THEN 20 
               WHEN 'sack50' THEN 50 
             END AS quantite_minimale_unites
      FROM matieres_premieres WHERE id = ?
    `).get(id);

    if (matiere) {
      matiere.facteur_conversion = UNITE_FACTEURS[matiere.unite];
    }
    return matiere;
  }

  // ✏️ Mettre à jour les infos d’une matière (unité modifiable, avec reconversion)
  static update(id, data) {
    const matiere = this.getById(id);
    if (!matiere) throw new Error('Matière non trouvée.');

    // Vérifier si le nom est modifié et déjà existant
    if (data.nom && data.nom.trim() !== matiere.nom) {
      const exists = db.prepare('SELECT id FROM matieres_premieres WHERE nom = ?').get(data.nom.trim());
      if (exists) throw new Error('Une autre matière avec ce nom existe déjà.');
    }

    let newUnite = data.unite || matiere.unite;
    const kgActuelle = data.quantite_actuelle !== undefined ? this.convertirEnKg(data.quantite_actuelle, newUnite) : matiere.quantite_actuelle;
    const kgMinimale = data.quantite_minimale !== undefined ? this.convertirEnKg(data.quantite_minimale, newUnite) : matiere.quantite_minimale;

    const stmt = db.prepare(`
      UPDATE matieres_premieres
      SET 
        nom = COALESCE(?, nom),
        quantite_actuelle = ?,
        quantite_minimale = ?,
        unite = COALESCE(?, unite),
        fournisseur_nom = COALESCE(?, fournisseur_nom),
        fournisseur_prenom = COALESCE(?, fournisseur_prenom),
        fournisseur_email = COALESCE(?, fournisseur_email),
        fournisseur_telephone = COALESCE(?, fournisseur_telephone)
      WHERE id = ?
    `);

    stmt.run(
      data.nom?.trim() || null,
      kgActuelle,
      kgMinimale,
      newUnite,
      data.fournisseur_nom?.trim() || null,
      data.fournisseur_prenom?.trim() || null,
      data.fournisseur_email?.trim() || null,
      data.fournisseur_telephone?.trim() || null,
      id
    );

    return this.getById(id);
  }

  // 📦 Mise à jour de la quantité actuelle (en unités, convertie en kg)
  static updateQuantite(id, quantite_unites, unite = null) {
    const matiere = this.getById(id);
    if (!matiere) throw new Error('Matière non trouvée.');

    const uniteFinale = unite || matiere.unite;
    const kgAjout = this.convertirEnKg(quantite_unites, uniteFinale);

    const result = db.prepare(`
      UPDATE matieres_premieres 
      SET quantite_actuelle = quantite_actuelle + ? 
      WHERE id = ?
    `).run(kgAjout, id);

    return result;
  }

  // ❌ Supprimer une matière première
  static delete(id) {
    return db.prepare(`DELETE FROM matieres_premieres WHERE id = ?`).run(id);
  }
}

module.exports = MatierePremiere;