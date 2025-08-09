//
// Fichier : C:\Users\WINDOWS 10\Desktop\Houlder\back\app\Models\index.js (corrigé)
//
const config = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    host: config.HOST,
    dialect: config.dialect,
    operatorsAliases: false,
    pool: {
      max: config.pool.max,
      min: config.pool.min,
      acquire: config.pool.acquire,
      idle: config.pool.idle,
    },
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importation des modèles
db.user = require("./user.model.js")(sequelize, Sequelize);
db.role = require("./role.model.js")(sequelize, Sequelize);
db.demande = require("./demande.model.js")(sequelize, Sequelize);
// Harmonisation du nom du modèle en "demande_detail" pour être cohérent avec le fichier
db.demande_detail = require("./demande_detail.model.js")(sequelize, Sequelize); 
db.journal = require("./journal.model.js")(sequelize, Sequelize);
db.budget = require("./budget.model.js")(sequelize, Sequelize);

// --- ASSOCIATIONS DE MODÈLES ---

// User (1) <-> (N) Demande
db.user.hasMany(db.demande, {
  foreignKey: "userId",
  as: "demandes",
});
db.demande.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user",
});

// Demande (1) <-> (N) Demande_detail
db.demande.hasMany(db.demande_detail, { // Modèle corrigé
  foreignKey: "demande_id",
  as: "details",
  onDelete: "CASCADE",
});
db.demande_detail.belongsTo(db.demande, { // Modèle corrigé
  foreignKey: "demande_id",
  as: "demande",
});

// User (1) <-> (N) Demande_detail (concernedUserId)
db.user.hasMany(db.demande_detail, { // Modèle corrigé
  foreignKey: "concerned_user_id",
  as: "concernedDetails",
  onDelete: "SET NULL",
});
db.demande_detail.belongsTo(db.user, { // Modèle corrigé
  foreignKey: "concerned_user_id",
  as: "concernedUser",
});

// Relation plusieurs-à-plusieurs entre Journal et Budget via journal_budgets
db.journal.belongsToMany(db.budget, {
  through: {
    model: "journal_budgets",
    timestamps: false
  },
  foreignKey: "journalId",
  otherKey: "budgetId"
});
db.budget.belongsToMany(db.journal, {
  through: {
    model: "journal_budgets",
    timestamps: false
  },
  foreignKey: "budgetId",
  otherKey: "journalId"
});


// Relation plusieurs-à-plusieurs entre User et Journal via user_journals
db.user.belongsToMany(db.journal, {
  through: "user_journals",
  foreignKey: "userId",
  otherKey: "journalId"
});
db.journal.belongsToMany(db.user, {
  through: "user_journals",
  foreignKey: "journalId",
  otherKey: "userId"
});


// Définition des rôles dans la base de données
db.ROLES = ["user", "admin", "approver", "rh", "daf", "caissier"];

module.exports = db;
