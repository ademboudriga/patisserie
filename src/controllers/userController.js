const db = require('../config/db');
const bcrypt = require('bcryptjs');

// --- Connexion (login) ---
exports.login = (req, res) => {
  const { username, password } = req.body;

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);

    if (!user) {
      return res.status(400).json({ error: 'Utilisateur non trouvé' });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Mot de passe incorrect' });
    }

    req.session.user = { id: user.id, username: user.username };
    res.json({ message: 'Connexion réussie ✅', user: req.session.user });

  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};


// --- Modifier email et/ou mot de passe ---
exports.updateUser = (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Non autorisé' });

  const { username, password } = req.body;
  if (!username && !password) return res.status(400).json({ error: 'Aucune donnée fournie' });

  let query = 'UPDATE users SET ';
  const params = [];

  if (username) {
    query += 'username = ?';
    params.push(username);
  }

if (password) {
  if (username) query += ', ';
  query += 'password = ?';
  const hashed = bcrypt.hashSync(password, 10); // <-- utiliser bcrypt
  params.push(hashed);
}

  query += ' WHERE id = ?';
  params.push(userId);

  db.prepare(query).run(...params);

  return res.json({ message: 'Profil mis à jour avec succès ✅' });
};
