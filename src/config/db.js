// 📁 src/config/db.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// === 📂 Création du dossier "data" s’il n’existe pas ===
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Dossier "data" créé.');
}

// === 📦 Connexion à la base SQLite ===
const dbPath = path.join(dataDir, 'db.sqlite');
const db = new Database(dbPath);
console.log(`📦 Base de données SQLite connectée : ${dbPath}`);

// === 🔒 Activation des clés étrangères ===
db.exec('PRAGMA foreign_keys = ON;');

// === 🧱 Création des tables ===

// --- Table utilisateurs ---
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);
`);

// --- Table matières premières ---
db.exec(`
CREATE TABLE IF NOT EXISTS matieres_premieres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT UNIQUE NOT NULL,
  quantite_actuelle REAL DEFAULT 0,
  quantite_minimale REAL DEFAULT 0,
  fournisseur_nom TEXT DEFAULT NULL,
  fournisseur_prenom TEXT DEFAULT NULL,
  fournisseur_email TEXT DEFAULT NULL,
  fournisseur_telephone TEXT DEFAULT NULL,
  unite TEXT DEFAULT 'kg'
);
`);

// --- Table produits ---
db.exec(`
CREATE TABLE IF NOT EXISTS produits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('gateau', 'croissant', 'pain')),
  prix REAL DEFAULT 0,
  quantite_stock INTEGER DEFAULT 0,
  quantite_vitrine INTEGER DEFAULT 0
);
`);

// --- Table commandes ---
db.exec(`
CREATE TABLE IF NOT EXISTS commandes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom_client TEXT NOT NULL,
  prenom_client TEXT NOT NULL,
  telephone TEXT NOT NULL,
  longueur REAL NOT NULL,
  largeur REAL NOT NULL,
  nombre_etages INTEGER DEFAULT 1,
  prix REAL NOT NULL,
  acompte REAL DEFAULT 0,
  description TEXT,
  date_livraison TEXT DEFAULT (datetime('now','localtime')),
  date_creation TEXT DEFAULT (datetime('now','localtime')),
  statut TEXT DEFAULT 'en attente'
);
`);

// --- Table consommation ---
db.exec(`
CREATE TABLE IF NOT EXISTS consommation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matiere_id INTEGER NOT NULL,
  quantite_utilisee REAL NOT NULL,
  date_consommation TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (matiere_id) REFERENCES matieres_premieres(id) ON DELETE CASCADE
);
`);

// --- Table ventes ---
db.exec(`
CREATE TABLE IF NOT EXISTS vente_produits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produit_id INTEGER NOT NULL,
  quantite_vendue INTEGER NOT NULL,
  montant_total REAL NOT NULL DEFAULT 0,
  date_vente TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  date_creation TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
);
`);

// --- Factures ---
db.exec(`
CREATE TABLE IF NOT EXISTS factures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom_complet TEXT NOT NULL,
  adresse TEXT DEFAULT NULL,
  telephone TEXT DEFAULT NULL,
  email TEXT DEFAULT NULL,
  total_a_payer REAL NOT NULL,
  acompte REAL DEFAULT 0,
  date_facture TEXT DEFAULT (datetime('now','localtime'))
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS facture_produits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facture_id INTEGER NOT NULL,
  produit_name TEXT NOT NULL,
  prix_unitaire REAL NOT NULL,
  quantite INTEGER NOT NULL,
  FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE
);
`);
// === 🔄 Migration : Ajout de la colonne 'unite' si manquante ===
try {
  // Vérifier si la colonne 'unite' existe (via PRAGMA table_info)
  const columns = db.prepare(`
    SELECT name FROM pragma_table_info('matieres_premieres')
    WHERE name = 'unite'
  `).all();

  if (columns.length === 0) {
    // Ajouter la colonne avec défaut 'kg'
    db.exec(`
      ALTER TABLE matieres_premieres 
      ADD COLUMN unite TEXT DEFAULT 'kg'
    `);
    // Mettre à jour les enregistrements existants (défaut appliqué auto)
    console.log('✅ Migration : Colonne "unite" ajoutée à matieres_premieres.');
  } else {
    console.log('ℹ️ Colonne "unite" déjà présente.');
  }
} catch (err) {
  console.error('❌ Erreur migration unite:', err.message);
}

// === 👤 Création automatique de l’utilisateur admin "MOKA" ===
const adminUsername = 'MOKA';
const adminPassword = 'azerty123';
const hashedPassword = bcrypt.hashSync(adminPassword, 10);

const admin = db.prepare('SELECT * FROM users WHERE username = ?').get(adminUsername);

if (!admin) {
  db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(adminUsername, hashedPassword);
  console.log(`✅ Utilisateur admin "${adminUsername}" créé (mot de passe : ${adminPassword})`);
} else {
  console.log(`ℹ️ Utilisateur admin "${adminUsername}" déjà existant`);
}

module.exports = db;
