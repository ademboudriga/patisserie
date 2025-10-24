const db = require('../config/db');


function getAllConsommations(req, res) {
  try {
    const { nom, limit = 10, offset = 0, page = 1 } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);
    const parsedPage = parseInt(page);

    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({ error: 'Limit doit être un entier > 0' });
    }
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({ error: 'Offset doit être un entier >= 0' });
    }

    // Requête avec filtre et pagination
    let sql = `
      SELECT 
        m.nom AS nom,
        strftime('%Y-%m-%d', c.date_consommation) AS jour,
        SUM(c.quantite_utilisee) AS total_quantite
      FROM consommation c
      JOIN matieres_premieres m ON c.matiere_id = m.id
    `;
    const params = [];
    let whereClause = '';

    if (nom && nom.trim()) {
      whereClause = ' WHERE m.nom LIKE ?';
      params.push(`%${nom.trim()}%`);
    }

    sql += whereClause;
    sql += `
      GROUP BY m.id, m.nom, jour
      ORDER BY jour DESC, total_quantite DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parsedLimit, parsedOffset);

    const consommations = db.prepare(sql).all(...params);

    // Compter le total pour pagination : utiliser une sous-requête pour compter les groupes
    let countSql = `
      SELECT COUNT(*) AS total FROM (
        SELECT m.id, strftime('%Y-%m-%d', c.date_consommation) AS jour
        FROM consommation c
        JOIN matieres_premieres m ON c.matiere_id = m.id
    `;
    const countParams = [];
    let countWhereClause = '';

    if (nom && nom.trim()) {
      countWhereClause = ' WHERE m.nom LIKE ?';
      countParams.push(`%${nom.trim()}%`);
    }

    countSql += countWhereClause;
    countSql += `
        GROUP BY m.id, jour
      ) AS subquery
    `;
    const total = db.prepare(countSql).get(...countParams)?.total || 0;

    if (consommations.length === 0) {
      return res.json({ data: [], total, currentPage: parsedPage });
    }

    res.status(200).json({
      data: consommations,
      total,
      currentPage: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
      hasNext: parsedOffset + parsedLimit < total,
      hasPrev: parsedOffset > 0
    });

  } catch (err) {
    console.error('❌ Erreur getAllConsommations:', err.message);
    res.status(500).json({
      error: 'Erreur lors du chargement des consommations',
      details: err.message
    });
  }
}


function searchConsommationsByDateAndNom(req, res) {
  try {
    const { date, nom, limit = 10, offset = 0, page = 1 } = req.query;

    if (!date) {
      return res.status(400).json({
        error: 'Le paramètre "date" est requis (format: YYYY-MM-DD)'
      });
    }

    // Validation date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Format de date invalide. Utilisez YYYY-MM-DD.'
      });
    }

    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);
    if (isNaN(parsedLimit) || parsedLimit < 1 || isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({ error: 'Pagination invalide.' });
    }

    // Requête
    let sql = `
      SELECT 
        m.nom AS nom,
        SUM(c.quantite_utilisee) AS total_quantite
      FROM consommation c
      JOIN matieres_premieres m ON c.matiere_id = m.id
      WHERE strftime('%Y-%m-%d', c.date_consommation) = ?
    `;
    const params = [date];

    if (nom && nom.trim()) {
      sql += ' AND m.nom LIKE ?';
      params.push(`%${nom.trim()}%`);
    }

    sql += `
      GROUP BY m.id, m.nom
      ORDER BY total_quantite DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parsedLimit, parsedOffset);

    const consommations = db.prepare(sql).all(...params);

    // Count total pour cette date (+ filtre nom)
    let countSql = `
      SELECT COUNT(DISTINCT m.id) AS total
      FROM consommation c
      JOIN matieres_premieres m ON c.matiere_id = m.id
      WHERE strftime('%Y-%m-%d', c.date_consommation) = ?
    `;
    const countParams = [date];
    if (nom && nom.trim()) {
      countSql += ' AND m.nom LIKE ?';
      countParams.push(`%${nom.trim()}%`);
    }
    const total = db.prepare(countSql).get(...countParams)?.total || 0;

    res.status(200).json({
      data: consommations,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parsedLimit),
      hasNext: parsedOffset + parsedLimit < total,
      hasPrev: parsedOffset > 0
    });

  } catch (err) {
    console.error('❌ Erreur searchConsommationsByDateAndNom:', err.message);
    res.status(500).json({
      error: 'Erreur lors de la recherche des consommations',
      details: err.message
    });
  }
}

module.exports = { getAllConsommations, searchConsommationsByDateAndNom };