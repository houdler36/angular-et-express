require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./app/Models');

const app = express();

// Configuration CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200'
};
app.use(cors(corsOptions));

// Middleware pour parser les requêtes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route simple de test
app.get('/', (req, res) => {
  res.json({ message: 'API Houlder fonctionnelle' });
});

// Import des routes
app.use('/api/auth', require('./app/routes/auth.routes'));
const authRoutes = require('./app/routes/auth.routes');
console.log("Routes d'authentification chargées :", authRoutes); // Devrait afficher l'objet Express Router
app.use('/api/auth', authRoutes);
app.use('/api/users', require('./app/routes/user.routes'));

// Configuration du port
const PORT = process.env.PORT || 8080;

// Synchronisation de la base de données
db.sequelize.sync({ force: false }) // Mettez à true pour réinitialiser la DB en développement
  .then(() => {
    console.log('Base de données synchronisée');
    
    // Création des rôles initiaux (optionnel)
    if (process.env.NODE_ENV === 'development') {
      initializeDatabase();
    }
  })
  .catch(err => {
    console.error('Erreur de synchronisation de la base:', err);
  });

// Fonction d'initialisation (optionnelle)
function initializeDatabase() {
  const Role = db.role;
  const initialRoles = ['user', 'admin', 'rh', 'daf', 'caissier'];
  
  initialRoles.forEach(role => {
    Role.findOrCreate({
      where: { name: role }
    });
  });
  
  console.log('Rôles initiaux créés');
}

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  console.error('Rejet non géré:', err);
});

module.exports = app; // Pour les tests