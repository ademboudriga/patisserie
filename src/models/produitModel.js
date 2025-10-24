const db = require('../config/db');

class ProduitModel {
  static allowedTypes = ['gateau', 'croissant', 'pain'];

  // 🔹 Validation du type
  static validateType(type) {
    if (!this.allowedTypes.includes(type.toLowerCase())) {
      throw new Error(`Type invalide : ${type}. Valeurs autorisées: ${this.allowedTypes.join(', ')}`);
    }
  }

  // 🔹 Vérifier si un produit existe déjà par nom
  static existsByName(nom) {
    const stmt = db.prepare(`SELECT COUNT(*) as total FROM produits WHERE LOWER(nom) = LOWER(?)`);
    const result = stmt.get(nom);
    return result.total > 0;
  }

  // 🔹 Récupérer un produit par ID
  static getById(id) {
    const stmt = db.prepare(`SELECT * FROM produits WHERE id = ?`);
    const produit = stmt.get(id);
    if (!produit) throw new Error('Produit introuvable');
    return produit;
  }

  // 🔹 Récupérer tous les produits
  static getAll(page = 1, limit = 10, search = '') {
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM produits`;
    const params = [];

    if (search.trim()) {
      query += ` WHERE nom LIKE ?`;
      params.push(`%${search.trim()}%`);
    }

    query += ` ORDER BY nom ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  // 🔹 Compter le total
  static getTotalCount(search = '') {
    let query = `SELECT COUNT(*) as total FROM produits`;
    const params = [];

    if (search.trim()) {
      query += ` WHERE nom LIKE ?`;
      params.push(`%${search.trim()}%`);
    }

    const stmt = db.prepare(query);
    return stmt.get(...params).total;
  }

  // 🔹 Création d’un produit (avec vérification du nom unique)
  static create({ nom, type, prix = 0, quantite_stock = 0, quantite_vitrine = 0 }) {
    if (this.existsByName(nom)) throw new Error('Nom de produit déjà existant');
    this.validateType(type);
    if (prix <= 0) throw new Error('Prix doit être supérieur à 0');

    const parsedStock = Number(quantite_stock);
    const parsedVitrine = Number(quantite_vitrine);

    if (isNaN(parsedStock) || parsedStock < 0 || isNaN(parsedVitrine) || parsedVitrine < 0) {
      throw new Error('Quantités invalides (doivent être >= 0)');
    }

    const stmt = db.prepare(`
      INSERT INTO produits (nom, type, prix, quantite_stock, quantite_vitrine)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = stmt.run(nom.trim(), type.toLowerCase(), prix, parsedStock, parsedVitrine);
    return {
      id: info.lastInsertRowid,
      nom: nom.trim(),
      type: type.toLowerCase(),
      prix,
      quantite_stock: parsedStock,
      quantite_vitrine: parsedVitrine,
    };
  }

  // 🔹 Mise à jour d’un produit
  static update(id, updates) {
    return db.transaction(() => {
      const produit = this.getById(id);
      if (!produit) throw new Error('Produit introuvable');

      // Vérifier si le nouveau nom existe déjà (autre produit)
      if (updates.nom && updates.nom.trim().toLowerCase() !== produit.nom.toLowerCase()) {
        if (this.existsByName(updates.nom)) throw new Error('Nom de produit déjà existant');
      }

      if (updates.type) this.validateType(updates.type);

      const newNom = updates.nom?.trim() ?? produit.nom;
      const newType = updates.type?.toLowerCase() ?? produit.type;
      const newPrix = updates.prix ?? produit.prix;

      const parsedStock = updates.quantite_stock != null ? Number(updates.quantite_stock) : produit.quantite_stock;
      const parsedVitrine = updates.quantite_vitrine != null ? Number(updates.quantite_vitrine) : produit.quantite_vitrine;

      if (isNaN(parsedStock) || parsedStock < 0 || isNaN(parsedVitrine) || parsedVitrine < 0) {
        throw new Error('Quantités invalides (doivent être >= 0)');
      }

      db.prepare(`
        UPDATE produits
        SET nom = ?, type = ?, prix = ?, quantite_stock = ?, quantite_vitrine = ?
        WHERE id = ?
      `).run(newNom, newType, newPrix, parsedStock, parsedVitrine, id);

      return this.getById(id);
    })();
  }

  // 🔹 Suppression
  static delete(id) {
    const stmt = db.prepare(`DELETE FROM produits WHERE id = ?`);
    const info = stmt.run(id);
    return info.changes > 0;
  }

  // 🔹 Consommer de la vitrine (enregistre la vente et met à jour la quantité)
  static consumeFromVitrine(id, quantite) {
    return db.transaction(() => {
      // Récupérer le produit actuel
      const produit = this.getById(id);
      const currentVitrine = produit.quantite_vitrine || 0;

      if (quantite > currentVitrine) {
        throw new Error(`Quantité dépasse la vitrine disponible (${currentVitrine})`);
      }

      if ((produit.prix || 0) <= 0) {
        throw new Error('Prix invalide : doit être supérieur à 0 pour enregistrer une vente');
      }

      const quantiteVendue = Number(quantite);
      if (isNaN(quantiteVendue) || quantiteVendue <= 0) {
        throw new Error('Quantité vendue invalide');
      }

      const montantTotal = quantiteVendue * produit.prix;

      // Insérer dans vente_produits
      const stmtVente = db.prepare(`
        INSERT INTO vente_produits (produit_id, quantite_vendue, montant_total)
        VALUES (?, ?, ?)
      `);
      const infoVente = stmtVente.run(id, quantiteVendue, montantTotal);

      // Mettre à jour la vitrine
      const newVitrine = currentVitrine - quantiteVendue;
      db.prepare(`UPDATE produits SET quantite_vitrine = ? WHERE id = ?`)
        .run(newVitrine, id);

      // Retourner les infos de la vente
      return {
        id: infoVente.lastInsertRowid,
        produit_id: parseInt(id),
        quantite_vendue: quantiteVendue,
        montant_total: montantTotal,
        date_vente: new Date().toLocaleString('fr-FR'),
        produit_nom: produit.nom,
        nouveau_stock_vitrine: newVitrine
      };
    })();
  }
}

module.exports = ProduitModel;