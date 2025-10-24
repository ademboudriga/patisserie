const db = require('../config/db');

class VenteProduitModel {
  // 🔹 Récupérer toutes les ventes
  static getAll() {
    return db.prepare(`
      SELECT 
        vp.id,
        vp.produit_id, 
        p.nom AS produit_nom, 
        p.type, 
        p.prix AS prix_unitaire, 
        vp.quantite_vendue, 
        vp.montant_total, 
        vp.date_vente
      FROM vente_produits vp
      JOIN produits p ON vp.produit_id = p.id
      ORDER BY vp.date_vente DESC
    `).all();
  }

  // 🔹 Total des ventes par produit et par jour
  static getTotalVenteParJour() {
    return db.prepare(`
      SELECT 
        p.nom AS produit_nom,
        p.type,
        DATE(vp.date_vente) AS jour,
        SUM(vp.quantite_vendue) AS total_quantite_vendue,
        SUM(vp.montant_total) AS total_vente
      FROM vente_produits vp
      JOIN produits p ON vp.produit_id = p.id
      GROUP BY produit_nom, jour
      ORDER BY jour DESC, produit_nom
    `).all();
  }
}

module.exports = VenteProduitModel;
