// app/models/index.js

const config = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    host: config.HOST,
    dialect: config.dialect,
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

// --- IMPORTATION DES MODÈLES ---
db.user = require("./user.model.js")(sequelize, Sequelize);
db.role = require("./role.model.js")(sequelize, Sequelize);
db.demande = require("./demande.model.js")(sequelize, Sequelize);
db.demande_detail = require("./demande_detail.model.js")(sequelize, Sequelize);
db.demande_validation = require("./demande_validation.model.js")(sequelize, Sequelize);
db.journal = require("./journal.model.js")(sequelize, Sequelize);
db.budget = require("./budget.model.js")(sequelize, Sequelize);
db.personne = require("./personne.model.js")(sequelize, Sequelize);
db.journalValider = require("./journal_valider.model.js")(sequelize, Sequelize);
db.Order = require("./order.model.js")(sequelize, Sequelize);
db.journalBudget = require("./journal_budget.model.js")(sequelize, Sequelize);
db.userJournal = require("./user_journal.model.js")(sequelize, Sequelize);

// --- ASSOCIATIONS ---

// User (1) <-> (N) Demande
db.user.hasMany(db.demande, { foreignKey: "userId", as: "demandes" });
db.demande.belongsTo(db.user, { foreignKey: "userId", as: "user" });

// Demande (1) <-> (N) Demande_detail
db.demande.hasMany(db.demande_detail, { foreignKey: "demande_id", as: "details", onDelete: "CASCADE" });
db.demande_detail.belongsTo(db.demande, { foreignKey: "demande_id", as: "demande" });

// DemandeDetail (N) <-> (1) Budget
db.demande_detail.belongsTo(db.budget, { foreignKey: "budget_id", as: "budget" });
db.budget.hasMany(db.demande_detail, { foreignKey: "budget_id", as: "demande_details" });

// Association responsable PJ : demande.resp_pj_id -> personne.id
db.demande.belongsTo(db.personne, { foreignKey: "resp_pj_id", targetKey: "id", as: "responsible_pj" });
db.personne.hasMany(db.demande, { foreignKey: "resp_pj_id", sourceKey: "id", as: "demandes_as_responsible" });

// Association journal demande : demande.journal_id -> journal.id_journal
db.demande.belongsTo(db.journal, { foreignKey: "journal_id", targetKey: "id_journal", as: "journal" });
db.journal.hasMany(db.demande, { foreignKey: "journal_id", sourceKey: "id_journal", as: "demandes" });

// Relation plusieurs-à-plusieurs Journal <-> Budget via journal_budgets
db.journal.belongsToMany(db.budget, { through: db.journalBudget, foreignKey: "journal_id", otherKey: "id_budget", as: "budgets" });
db.budget.belongsToMany(db.journal, { through: db.journalBudget, foreignKey: "id_budget", otherKey: "journal_id", as: "journals" });

// Association User (1) <-> (N) Order
db.user.hasMany(db.Order, { foreignKey: "userId", as: "orders" });
db.Order.belongsTo(db.user, { foreignKey: "userId", as: "user" });

// Association User <-> Journal via user_journals (N:M)
db.user.belongsToMany(db.journal, { through: db.userJournal, foreignKey: "userId", otherKey: "journalId", as: "journals" });
db.journal.belongsToMany(db.user, { through: db.userJournal, foreignKey: "journalId", otherKey: "userId", as: "users" });

// Association journal_validers (User <-> JournalValider)
db.user.hasMany(db.journalValider, { foreignKey: "user_id", as: "validationConfigs" });
db.journalValider.belongsTo(db.user, { foreignKey: "user_id", as: "user" });

db.journal.hasMany(db.journalValider, { foreignKey: "journal_id", as: "validationsConfig" });
db.journalValider.belongsTo(db.journal, { foreignKey: "journal_id", as: "journal" });

// --- Associations Demande_validation ---
db.demande.hasMany(db.demande_validation, { foreignKey: "demande_id", as: "validations", onDelete: "CASCADE" });
db.demande_validation.belongsTo(db.demande, { foreignKey: "demande_id", as: "demande" });

db.demande_validation.belongsTo(db.user, { foreignKey: "user_id", as: "user" });
db.user.hasMany(db.demande_validation, { foreignKey: "user_id", as: "demandeValidations" });

// --- Définition des rôles ---
db.ROLES = ["user", "admin", "approver", "rh", "daf", "caissier"];

module.exports = db;
