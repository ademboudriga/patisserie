/*// 📁 src/init-db.js
const db = require('./config/db');

// 🔒 Activation des clés étrangères
db.exec('PRAGMA foreign_keys = ON;');

// === TABLE USERS ===
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);
`);

// === TABLE MATIERES PREMIERES ===
db.exec(`
CREATE TABLE IF NOT EXISTS matieres_premieres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  quantite_actuelle REAL DEFAULT 0,
  quantite_minimale REAL DEFAULT 0,
  fournisseur_nom TEXT,
  fournisseur_prenom TEXT,
  fournisseur_email TEXT,
  fournisseur_telephone TEXT
);
`);

// === TABLE GATEAUX ===
db.exec(`
CREATE TABLE IF NOT EXISTS gateaux (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  prix REAL DEFAULT 0,
  quantite_stock INTEGER DEFAULT 0,
  quantite_vitrine INTEGER DEFAULT 0,
  image TEXT
);
`);

// === TABLE CONSOMMATION ===
// === TABLE CONSOMMATION ===
db.exec(`
CREATE TABLE IF NOT EXISTS consommation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matiere_id INTEGER NOT NULL,
    quantite_utilisee REAL NOT NULL,
    date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (matiere_id) REFERENCES matieres_premieres(id)
);
`);


console.log('✅ Toutes les tables ont été créées ou déjà existantes.');
*/