//server.js
const express = require('express');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();
require('./init-db'); // ✅ Initialise la base de données SQLite



// ------------------------
// ⚙️ Initialisation de l'application
// ------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// ------------------------
// 🧩 Middleware
// ------------------------
app.use(express.json()); // ✅ Pour lire les requêtes JSON
app.use(cors());         // ✅ Active les requêtes CORS
app.use(express.static('public')); // ✅ Sert les fichiers statiques (images, CSS, etc.)

// 🧠 Gestion de session (optionnelle pour authentification)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // ⚠️ À mettre sur true si HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60, // 1 heure
    },
  })
);

// ------------------------
// 🚏 Importation des routes
// ------------------------
const userRoutes = require('./routes/userRoutes');
const matiereRoutes = require('./routes/matiereRoutes');
const consommationRoutes = require('./routes/consommationRoutes');
const venteProduitRoutes = require('./routes/venteProduitRoutes');
const produitRoutes = require('./routes/produitRoutes');
const commandeRoutes = require('./routes/commandeRoutes'); // ✅ Routes commandes
const factureRoutes = require('./routes/FactureRoutes');


app.use('/api/users', userRoutes);
app.use('/api/matieres', matiereRoutes);
app.use('/api/consommations', consommationRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/ventes', venteProduitRoutes);
app.use('/api/commandes', commandeRoutes); // ✅ Routes commandes
app.use('/api/factures', factureRoutes);

app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url} - Body:`, req.body);
  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'Serveur Pâtisserie  opérationnel !' });
});

// ------------------------
// 🚀 Lancement du serveur
// ------------------------
app.listen(PORT, () => {
  console.log('📦 Base de données SQLite initialisée');
  console.log(`🚀 Serveur lancé sur : http://localhost:${PORT}`);
});
