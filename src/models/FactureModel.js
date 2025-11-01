// 📁 src/models/FactureModel.js
const db = require('../config/db');

// === Modèle pour les factures ===

/**
 * Créer une nouvelle facture
 * @param {Object} factureData - Données de la facture { nom_complet, total_a_payer, acompte, date_facture }
 * @returns {Object} - La facture créée avec son ID
 */
const createFacture = (factureData) => {
  const { nom_complet, total_a_payer, acompte = 0, date_facture } = factureData;
  const stmt = db.prepare(`
    INSERT INTO factures (nom_complet, total_a_payer, acompte, date_facture)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(nom_complet, total_a_payer, acompte, date_facture || new Date().toISOString().split('T')[0]);
  return { id: result.lastInsertRowid, ...factureData };
};

/**
 * Récupérer toutes les factures avec filtres et pagination optionnels
 * @param {Object} filters - Filtres { client, date, startDate, endDate, page, limit }
 * @returns {Object} - { factures: Array, total: number, page: number, limit: number }
 */
const getAllFactures = (filters = {}) => {
  let sql = 'SELECT * FROM factures';
  const params = [];
  const conditions = [];

  if (filters.client) {
    conditions.push('nom_complet LIKE ?');
    params.push(`%${filters.client}%`);
  }

  if (filters.date) {
    conditions.push('date(date_facture) = ?');
    params.push(filters.date);
  }

  if (filters.startDate || filters.endDate) {
    conditions.push('date_facture BETWEEN ? AND ?');
    params.push(filters.startDate || '1900-01-01', filters.endDate || new Date().toISOString().split('T')[0]);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  // Compter le total pour pagination
  const countSql = sql.replace('*', 'COUNT(*) as total');
  const totalResult = db.prepare(countSql).get(params);
  const total = totalResult.total;

  // Pagination
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const offset = (page - 1) * limit;

  sql += ' ORDER BY date_facture DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const factures = db.prepare(sql).all(params);

  return { factures, total, page, limit };
};

/**
 * Récupérer une facture par ID
 * @param {number} id - ID de la facture
 * @returns {Object|null} - La facture ou null si non trouvée
 */
const getFactureById = (id) => {
  return db.prepare('SELECT * FROM factures WHERE id = ?').get(id);
};

/**
 * Mettre à jour une facture
 * @param {number} id - ID de la facture
 * @param {Object} factureData - Données mises à jour
 * @returns {Object} - La facture mise à jour
 */
const updateFacture = (id, factureData) => {
  const { nom_complet, total_a_payer, acompte, date_facture } = factureData;
  const stmt = db.prepare(`
    UPDATE factures
    SET nom_complet = ?, total_a_payer = ?, acompte = ?, date_facture = ?
    WHERE id = ?
  `);
  stmt.run(nom_complet, total_a_payer, acompte, date_facture, id);
  return getFactureById(id);
};

/**
 * Supprimer une facture (et ses produits associés via CASCADE)
 * @param {number} id - ID de la facture
 * @returns {boolean} - Succès de la suppression
 */
const deleteFacture = (id) => {
  const result = db.prepare('DELETE FROM factures WHERE id = ?').run(id);
  return result.changes > 0;
};

/**
 * Ajouter un produit à une facture
 * @param {number} factureId - ID de la facture
 * @param {Object} produitData - { produit_name, prix_unitaire, quantite }
 * @returns {Object} - Le produit ajouté avec son ID
 */
const addProduitToFacture = (factureId, produitData) => {
  const { produit_name, prix_unitaire, quantite } = produitData;
  const stmt = db.prepare(`
    INSERT INTO facture_produits (facture_id, produit_name, prix_unitaire, quantite)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(factureId, produit_name, prix_unitaire, quantite);
  // Recalculer le total de la facture si nécessaire (optionnel, à implémenter)
  return { id: result.lastInsertRowid, ...produitData };
};

/**
 * Récupérer les produits d'une facture
 * @param {number} factureId - ID de la facture
 * @returns {Array} - Liste des produits
 */
const getProduitsByFactureId = (factureId) => {
  return db.prepare('SELECT * FROM facture_produits WHERE facture_id = ?').all(factureId);
};

/**
 * Supprimer un produit d'une facture
 * @param {number} produitId - ID du produit dans facture_produits
 * @returns {boolean} - Succès de la suppression
 */
const deleteProduitFromFacture = (produitId) => {
  const result = db.prepare('DELETE FROM facture_produits WHERE id = ?').run(produitId);
  return result.changes > 0;
};

// === Export des fonctions du modèle ===
module.exports = {
  createFacture,
  getAllFactures,
  getFactureById,
  updateFacture,
  deleteFacture,
  addProduitToFacture,
  getProduitsByFactureId,
  deleteProduitFromFacture
};