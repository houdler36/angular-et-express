// app/models/index.js

const config = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD, {
    host: config.HOST,
    dialect: config.dialect,
    operatorsAliases: false, // Cette option est dépréciée si Sequelize >= 5
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
db.demande_detail = require("./demande_detail.model.js")(sequelize, Sequelize);
db.journal = require("./journal.model.js")(sequelize, Sequelize);
db.budget = require("./budget.model.js")(sequelize, Sequelize);
db.personne = require("./personne.model.js")(sequelize, Sequelize);
db.journalValider = require("./journal_valider.js")(sequelize, Sequelize); // Chemin corrigé
db.Order = require("./order.model.js")(sequelize, Sequelize);

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
db.demande.hasMany(db.demande_detail, {
  foreignKey: "demande_id",
  as: "details",
  onDelete: "CASCADE",
});
db.demande_detail.belongsTo(db.demande, {
  foreignKey: "demande_id",
  as: "demande",
});

// User (1) <-> (N) Demande_detail (concernedUserId)
db.user.hasMany(db.demande_detail, {
  foreignKey: "concerned_user_id",
  as: "concernedDetails",
  onDelete: "SET NULL",
});
db.demande_detail.belongsTo(db.user, {
  foreignKey: "concerned_user_id",
  as: "concernedUser",
});

// Association responsable PJ : demande.resp_pj_id -> personne.id
db.demande.belongsTo(db.personne, {
  foreignKey: "resp_pj_id",
  targetKey: "id",
  as: "responsible_pj",
});
db.personne.hasMany(db.demande, {
  foreignKey: "resp_pj_id",
  sourceKey: "id",
  as: "demandes_as_responsible",
});

// Association journal demande : demande.journal_id -> journal.id_journal
db.demande.belongsTo(db.journal, {
  foreignKey: "journal_id",
  targetKey: "id_journal",
  as: "journal",
});
db.journal.hasMany(db.demande, {
  foreignKey: "journal_id",
  sourceKey: "id_journal",
  as: "demandes",
});

// Relation plusieurs-à-plusieurs Journal <-> Budget via journal_budgets
db.journal.belongsToMany(db.budget, {
  through: {
    model: "journal_budgets",
    timestamps: false,
  },
  foreignKey: "journalId",
  otherKey: "budgetId",
});
db.budget.belongsToMany(db.journal, {
  through: {
    model: "journal_budgets",
    timestamps: false,
  },
  foreignKey: "budgetId",
  otherKey: "journalId",
});

// Relation plusieurs-à-plusieurs User <-> Journal via user_journals
db.user.belongsToMany(db.journal, {
  through: {
    model: "user_journals",
    timestamps: false,
  },
  foreignKey: "userId",
  otherKey: "journalId",
  as: "journals",
});
db.journal.belongsToMany(db.user, {
  through: {
    model: "user_journals",
    timestamps: false,
  },
  foreignKey: "journalId",
  otherKey: "userId",
  as: "users",
});

// Association Journal <-> User via journal_validers (validateurs avec statut)
db.journal.belongsToMany(db.user, {
  through: db.journalValider,
  foreignKey: "journal_id",
  otherKey: "user_id",
  as: "valideurs",
});
db.user.belongsToMany(db.journal, {
  through: db.journalValider,
  foreignKey: "user_id",
  otherKey: "journal_id",
  as: "journalsToValidate",
});

// Association directe journalValider -> journal & user
db.journalValider.belongsTo(db.journal, { foreignKey: "journal_id", as: "journal" });
db.journalValider.belongsTo(db.user, { foreignKey: "user_id", as: "user" });
db.journal.hasMany(db.journalValider, { foreignKey: "journal_id", as: "validations" });
db.user.hasMany(db.journalValider, { foreignKey: "user_id", as: "validations" });

// Association User (1) <-> (N) Order
db.user.hasMany(db.Order, {
  foreignKey: "userId",
  as: "orders",
});
db.Order.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user",
});

// Définition des rôles dans la base de données
db.ROLES = ["user", "admin", "approver", "rh", "daf", "caissier"];

module.exports = db;