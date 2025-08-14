// Fichier principal : server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./app/Models');

const app = express();

const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// Utilisation des routeurs avec des préfixes clairs
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/demandes', demandeRoutes);
app.use('/api/utils', utilsRouter);
app.use('/api/budgets', budgetRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api', journalValiderRoutes);
app.use('/api/personnes', personneRoutes);

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

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Rejet non géré à:', promise, 'raison:', reason);
});

module.exports = app;
