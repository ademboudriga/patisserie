// 📁 src/models/consommationModel.js
const db = require('../config/db');

/**
 * Modèle pour les consommations de matières premières
 * Gère les opérations CRUD avec validation et intégration stock
 */
class Consommation {
  // === VALIDATION UTILITAIRE ===
  static validateId(id) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('ID doit être un entier positif');
    }
  }

  static validateQuantite(quantite) {
    if (typeof quantite !== 'number' || quantite <= 0) {
      throw new Error('Quantité doit être un nombre positif');
    }
  }

  static validateMatiereId(matiereId) {
    this.validateId(matiereId);
    // Vérifier existence de la matière
    const matiere = db.prepare('SELECT id FROM matieres_premieres WHERE id = ?').get(matiereId);
    if (!matiere) {
      throw new Error(`Matière première avec ID ${matiereId} n'existe pas`);
    }
  }

  // === CREATE ===
  /**
   * Crée une nouvelle consommation et met à jour le stock de la matière
   * @param {number} matiereId - ID de la matière première
   * @param {number} quantiteUtilisee - Quantité utilisée (> 0)
   * @returns {object} { success: boolean, id: number | null, error: string | null }
   */
  static create(matiereId, quantiteUtilisee) {
    try {
      this.validateMatiereId(matiereId);
      this.validateQuantite(quantiteUtilisee);

      // Transaction pour atomicité : insert + update stock
      db.transaction(() => {
        // Vérifier stock suffisant
        const matiere = db.prepare('SELECT quantite_actuelle FROM matieres_premieres WHERE id = ?').get(matiereId);
        if (matiere.quantite_actuelle < quantiteUtilisee) {
          throw new Error(`Stock insuffisant pour ${quantiteUtilisee} unités`);
        }

        // Insert consommation
        const result = db.prepare(`
          INSERT INTO consommation (matiere_id, quantite_utilisee, date_consommation)
          VALUES (?, ?, datetime('now', 'localtime'))
        `).run(matiereId, quantiteUtilisee);

        // Update stock
        db.prepare(`
          UPDATE matieres_premieres 
          SET quantite_actuelle = quantite_actuelle - ?
          WHERE id = ?
        `).run(quantiteUtilisee, matiereId);

        return result;
      })();

      return { success: true, id: db.lastInsertRowid };
    } catch (err) {
      console.error('❌ Erreur création consommation:', err.message);
      return { success: false, id: null, error: err.message };
    }
  }

  // === READ ===
  /**
   * Récupère toutes les consommations (avec jointure matière)
   * @param {number} [limit=50] - Limite résultats
   * @param {number} [offset=0] - Offset pour pagination
   * @returns {array} Tableau d'objets consommation
   */
  static getAll(limit = 50, offset = 0) {
    try {
      if (limit < 1 || offset < 0) {
        throw new Error('Limite et offset doivent être valides');
      }
      return db.prepare(`
        SELECT 
          c.id, c.matiere_id, c.quantite_utilisee, c.date_consommation,
          m.nom AS matiere_nom
        FROM consommation c
        JOIN matieres_premieres m ON c.matiere_id = m.id
        ORDER BY c.date_consommation DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset);
    } catch (err) {
      console.error('❌ Erreur getAll consommations:', err.message);
      throw err;
    }
  }

  /**
   * Récupère une consommation par ID
   * @param {number} id - ID de la consommation
   * @returns {object|null} Consommation ou null
   */
  static getById(id) {
    try {
      this.validateId(id);
      return db.prepare(`
        SELECT 
          c.*, m.nom AS matiere_nom
        FROM consommation c
        JOIN matieres_premieres m ON c.matiere_id = m.id
        WHERE c.id = ?
      `).get(id);
    } catch (err) {
      console.error('❌ Erreur getById consommation:', err.message);
      throw err;
    }
  }

  // === UPDATE ===
  /**
   * Met à jour la quantité d'une consommation et ajuste le stock
   * @param {number} id - ID de la consommation
   * @param {number} quantite - Nouvelle quantité (> 0)
   * @returns {object} { success: boolean, changes: number, error: string | null }
   */
  static updateQuantite(id, quantite) {
    try {
      this.validateId(id);
      this.validateQuantite(quantite);

      // Récupérer ancienne quantité pour ajuster stock
      const ancienne = this.getById(id);
      if (!ancienne) {
        throw new Error(`Consommation avec ID ${id} n'existe pas`);
      }

      const delta = quantite - ancienne.quantite_utilisee;

      // Transaction
      db.transaction(() => {
        // Update consommation
        const result = db.prepare(`
          UPDATE consommation 
          SET quantite_utilisee = ?
          WHERE id = ?
        `).run(quantite, id);

        if (result.changes === 0) {
          throw new Error('Aucune ligne mise à jour');
        }

        // Ajuster stock (inverser delta si négatif)
        db.prepare(`
          UPDATE matieres_premieres 
          SET quantite_actuelle = quantite_actuelle - ?
          WHERE id = ?
        `).run(delta, ancienne.matiere_id);

        return result;
      })();

      return { success: true, changes: 1 };
    } catch (err) {
      console.error('❌ Erreur updateQuantite:', err.message);
      return { success: false, changes: 0, error: err.message };
    }
  }

  // === DELETE ===
  /**
   * Supprime une consommation et restaure le stock
   * @param {number} id - ID de la consommation
   * @returns {object} { success: boolean, changes: number, error: string | null }
   */
  static delete(id) {
    try {
      this.validateId(id);
      const consommation = this.getById(id);
      if (!consommation) {
        throw new Error(`Consommation avec ID ${id} n'existe pas`);
      }

      // Transaction : delete + restore stock
      db.transaction(() => {
        // Delete
        const result = db.prepare('DELETE FROM consommation WHERE id = ?').run(id);

        if (result.changes === 0) {
          throw new Error('Aucune ligne supprimée');
        }

        // Restaurer stock
        db.prepare(`
          UPDATE matieres_premieres 
          SET quantite_actuelle = quantite_actuelle + ?
          WHERE id = ?
        `).run(consommation.quantite_utilisee, consommation.matiere_id);

        return result;
      })();

      return { success: true, changes: 1 };
    } catch (err) {
      console.error('❌ Erreur delete consommation:', err.message);
      return { success: false, changes: 0, error: err.message };
    }
  }
}

module.exports = Consommation;