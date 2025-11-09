// 📁 src/models/FactureModel.js
const db = require('../config/db');

// === Modèle pour les factures ===

/**
 * Créer une nouvelle facture
 * @param {Object} factureData - Données de la facture { nom_complet, total_a_payer, acompte = 0, date_facture, adresse, telephone, email }
 * @returns {Object} - La facture créée avec son ID
 */
const createFacture = (factureData) => {
  const { nom_complet, total_a_payer, acompte = 0, date_facture, adresse, telephone, email } = factureData;
  const stmt = db.prepare(`
    INSERT INTO factures (nom_complet, total_a_payer, acompte, date_facture, adresse, telephone, email)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(nom_complet, total_a_payer, acompte, date_facture || new Date().toISOString().split('T')[0], adresse || null, telephone || null, email || null);
  return { id: result.lastInsertRowid, ...factureData, produits: [] };
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
 * Récupérer les factures pour impression par client et période
 * @param {Object} filters - { client, startDate, endDate }
 * @returns {Array} - Liste des factures avec leurs produits groupés
 */
const getFacturesForPrint = (filters = {}) => {
  let sql = `
    SELECT f.*, fp.*
    FROM factures f
    LEFT JOIN facture_produits fp ON f.id = fp.facture_id
    WHERE 1=1
  `;
  const params = [];

  if (filters.client) {
    sql += ' AND f.nom_complet LIKE ?';
    params.push(`%${filters.client}%`);
  }

  if (filters.startDate || filters.endDate) {
    sql += ' AND f.date_facture BETWEEN ? AND ?';
    params.push(filters.startDate || '1900-01-01', filters.endDate || new Date().toISOString().split('T')[0]);
  }

  sql += ' ORDER BY f.date_facture DESC, fp.id';

  const results = db.prepare(sql).all(params);

  // Grouper par facture
  const grouped = {};
  results.forEach(row => {
    if (row.id && !grouped[row.id]) {
      grouped[row.id] = {
        id: row.id,
        nom_complet: row.nom_complet,
        adresse: row.adresse,
        telephone: row.telephone,
        email: row.email,
        date_facture: row.date_facture,
        acompte: row.acompte,
        total_a_payer: row.total_a_payer,
        produits: []
      };
    }
    if (row.produit_name) { // Si c'est une ligne de produit
      grouped[row.id].produits.push({
        produit_name: row.produit_name,
        prix_unitaire: row.prix_unitaire,
        quantite: row.quantite,
        sous_total: (row.prix_unitaire * row.quantite).toFixed(2)
      });
    }
  });

  return Object.values(grouped);
};

/**
 * Récupérer une facture par ID avec ses produits
 * @param {number} id - ID de la facture
 * @returns {Object} - Facture avec produits
 */
const getFactureById = (id) => {
  const facture = db.prepare('SELECT * FROM factures WHERE id = ?').get(id);
  if (!facture) return null;
  const produits = db.prepare('SELECT * FROM facture_produits WHERE facture_id = ?').all(id);
  return { ...facture, produits };
};

/**
 * Mettre à jour une facture
 * @param {number} id - ID de la facture
 * @param {Object} factureData - Données mises à jour
 * @returns {Object} - La facture mise à jour
 */
const updateFacture = (id, factureData) => {
  const { nom_complet, total_a_payer, acompte, date_facture, adresse, telephone, email } = factureData;
  const stmt = db.prepare(`
    UPDATE factures
    SET nom_complet = ?, total_a_payer = ?, acompte = ?, date_facture = ?, adresse = ?, telephone = ?, email = ?
    WHERE id = ?
  `);
  stmt.run(nom_complet, total_a_payer, acompte, date_facture, adresse || null, telephone || null, email || null, id);
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
  getFacturesForPrint,
  getFactureById,
  updateFacture,
  deleteFacture,
  addProduitToFacture,
  getProduitsByFactureId,
  deleteProduitFromFacture
};