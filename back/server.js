require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./app/Models');

const app = express();

/* ======================
   CONFIG CORS
====================== */
const corsOptions = {
  origin: [
    'http://localhost:4200', // Angular
    'http://localhost:8081'  // Autre front local si nécessaire
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: ["Content-Type", "Authorization", "x-access-token"], // <--- ajouter x-access-token
  credentials: true
};

// Appliquer CORS globalement
app.use(cors(corsOptions));
// Répondre aux requêtes preflight
app.options('*', cors(corsOptions));

/* ======================
   BODY PARSER
====================== */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* ======================
   ROUTES
====================== */
app.get('/', (req, res) => {
  res.json({ message: 'API Houlder fonctionnelle' });
});

// Importation des routeurs
const authRoutes = require('./app/routes/auth.routes');
const userRoutes = require('./app/routes/user.routes');
const demandeRoutes = require('./app/routes/demande.routes');
const utilsRouter = require('./app/routes/utils.routes');
const personneRoutes = require('./app/routes/personne.routes');
const budgetRoutes = require('./app/routes/budget.routes');
const journalRoutes = require('./app/routes/journal.routes');
const journalValiderRoutes = require('./app/routes/journalValider.routes');
const uploadRoutes = require('./app/routes/upload.routes');
const path = require('path');
const statsRoutes = require('./app/routes/stats.routes');

// Servir le dossier public/uploads pour les fichiers uploadés
app.use('/uploads', (req, res, next) => {
  console.log('Requested file:', req.url);
  next();
});
app.use('/uploads/signatures', express.static(path.join(__dirname, 'public/uploads/signatures')));




// Utilisation des routeurs
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/demandes', demandeRoutes);
app.use('/api/utils', utilsRouter);
app.use('/api/budgets', budgetRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api', journalValiderRoutes);
app.use('/api/personnes', personneRoutes);
app.use('/api', uploadRoutes);
app.use('/api/stats', statsRoutes);
/* ======================
   DB + INIT
====================== */
const PORT = process.env.PORT || 8081;

db.sequelize.sync({ force: false }).then(() => {
  console.log('Base de données synchronisée');
  if (process.env.NODE_ENV === 'development') {
    initializeDatabase();
  }
}).catch(err => {
  console.error('Erreur de synchronisation de la base:', err);
});

function initializeDatabase() {
  const Role = db.role;
  const roles = ['user', 'admin', 'approver', 'rh', 'daf', 'caissier'];
  roles.forEach(name => {
    Role.findOrCreate({ where: { name } })
      .then(([role, created]) => {
        console.log(`Rôle '${role.name}' ${created ? 'créé' : 'existe déjà'}`);
      })
      .catch(err => console.error(`Erreur création rôle '${name}':`, err));
  });
}

/* ======================
   DEMARRAGE SERVEUR
====================== */
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Rejet non géré à:', promise, 'raison:', reason);
});

module.exports = app;
