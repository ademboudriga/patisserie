// 📁 src/models/commandeModel.js
const db = require('../config/db');

class CommandeModel {
  static allowedStatuts = ['en attente', 'livrée'];

  // ✅ Validation du statut
  static validateStatut(statut) {
    if (!this.allowedStatuts.includes(statut)) {
      throw new Error(
        `Statut invalide : ${statut}. Valeurs autorisées : ${this.allowedStatuts.join(', ')}`
      );
    }
  }

  // ✅ Récupérer une commande par ID
  static getById(id) {
    try {
      const stmt = db.prepare(`SELECT * FROM commandes WHERE id = ?`);
      const commande = stmt.get(id);
      if (!commande) throw new Error('Commande introuvable');
      return commande;
    } catch (err) {
      console.error('[DEBUG] Erreur getById:', err.message);
      throw new Error('Erreur lors de la récupération : ' + err.message);
    }
  }

  // ✅ Récupérer toutes les commandes avec recherche, pagination et tri
  static getAll({ search = '', page = 1, limit = 10 } = {}) {
    try {
      page = Number(page);
      limit = Number(limit);
      const offset = (page - 1) * limit;

      // 🔹 Récupérer toutes les commandes
      let commandes = db.prepare(`SELECT * FROM commandes`).all();

      // 🔹 Filtrer par nom ou prénom si search présent
      if (search) {
        const s = search.toLowerCase();
        commandes = commandes.filter(
          c => c.nom_client.toLowerCase().includes(s) || c.prenom_client.toLowerCase().includes(s)
        );
      }

      // 🔹 Trier les commandes
      commandes.sort((a, b) => {
        // Livrée → date_creation DESC
        if (a.statut === 'livrée' && b.statut === 'livrée') {
          return new Date(b.date_creation) - new Date(a.date_creation);
        }
        // En attente → date_livraison ASC
        if (a.statut === 'en attente' && b.statut === 'en attente') {
          return new Date(a.date_livraison) - new Date(b.date_livraison);
        }
        // Livrée après en attente
        if (a.statut === 'livrée') return 1;
        if (b.statut === 'livrée') return -1;
        return 0;
      });

      // 🔹 Pagination
      const total = commandes.length;
      const paginated = commandes.slice(offset, offset + limit);

      return { total, page, limit, commandes: paginated };
    } catch (err) {
      console.error('[DEBUG] Erreur getAll:', err.message);
      throw new Error('Erreur lors du chargement des commandes : ' + err.message);
    }
  }

  // ✅ Créer une nouvelle commande
  static create(data) {
    const {
      nom_client,
      prenom_client,
      telephone,
      longueur,
      largeur,
      nombre_etages = 1,
      prix,
      accompte = 0,
      description = null,
      date_livraison,
      statut = 'en attente'
    } = data;

    if (!nom_client || !prenom_client || !telephone || longueur == null || largeur == null || prix == null) {
      throw new Error('Tous les champs obligatoires doivent être remplis.');
    }
    if (!date_livraison) throw new Error('La date de livraison est obligatoire.');

    this.validateStatut(statut);

    try {
      const stmt = db.prepare(`
        INSERT INTO commandes 
        (nom_client, prenom_client, telephone, longueur, largeur, nombre_etages, prix, accompte, description, date_livraison, statut, date_creation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const info = stmt.run(
        nom_client,
        prenom_client,
        telephone,
        Number(longueur),
        Number(largeur),
        Number(nombre_etages),
        Number(prix),
        Number(accompte),
        description,
        date_livraison,
        statut,
        new Date().toISOString()
      );

      return this.getById(info.lastInsertRowid);
    } catch (err) {
      console.error('[DEBUG] Erreur create:', err.message);
      throw new Error('Erreur lors de la création de la commande : ' + err.message);
    }
  }

  // ✅ Mettre à jour une commande
  static update(id, data) {
    const commande = this.getById(id);

    const {
      nom_client = commande.nom_client,
      prenom_client = commande.prenom_client,
      telephone = commande.telephone,
      longueur = commande.longueur,
      largeur = commande.largeur,
      nombre_etages = commande.nombre_etages,
      prix = commande.prix,
      accompte = commande.accompte,
      description = commande.description,
      date_livraison = commande.date_livraison,
      statut = commande.statut
    } = data;

    this.validateStatut(statut);

    try {
      const stmt = db.prepare(`
        UPDATE commandes
        SET nom_client = ?, prenom_client = ?, telephone = ?, longueur = ?, largeur = ?, 
            nombre_etages = ?, prix = ?, accompte = ?, description = ?, date_livraison = ?, statut = ?
        WHERE id = ?
      `);

      stmt.run(
        nom_client,
        prenom_client,
        telephone,
        Number(longueur),
        Number(largeur),
        Number(nombre_etages),
        Number(prix),
        Number(accompte),
        description,
        date_livraison,
        statut,
        id
      );

      return this.getById(id);
    } catch (err) {
      console.error('[DEBUG] Erreur update:', err.message);
      throw new Error('Erreur lors de la mise à jour de la commande : ' + err.message);
    }
  }

  // ✅ Supprimer une commande
  static delete(id) {
    try {
      const stmt = db.prepare(`DELETE FROM commandes WHERE id = ?`);
      const info = stmt.run(id);
      return info.changes > 0;
    } catch (err) {
      console.error('[DEBUG] Erreur delete:', err.message);
      throw new Error('Erreur lors de la suppression : ' + err.message);
    }
  }
}

module.exports = CommandeModel;
