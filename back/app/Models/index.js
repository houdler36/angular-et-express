const dbConfig = require("../Config/db.config");
const { Sequelize } = require("sequelize"); // On déstructure Sequelize ici

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  pool: { // Assurez-vous d'avoir les options de pool si vous les utilisez dans db.config
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const db = {};

db.Sequelize = Sequelize; // L'objet Sequelize complet (avec .STRING, .INTEGER, etc.)
db.sequelize = sequelize; // L'instance de connexion

// Import des modèles
db.user = require("./user.model")(sequelize, Sequelize); // Passez Sequelize pour les types de données
db.role = require("./role.model")(sequelize, Sequelize); // <--- AJOUTEZ CETTE LIGNE

// Définition des relations (si elles sont nécessaires pour votre structure)
// Si vous avez une table de jointure (user_roles) pour la relation Many-to-Many entre User et Role
// db.role.belongsToMany(db.user, {
//   through: "user_roles",
//   foreignKey: "roleId",
//   otherKey: "userId"
// });
// db.user.belongsToMany(db.role, {
//   through: "user_roles",
//   foreignKey: "userId",
//   otherKey: "roleId"
// });

// Définition de la liste des rôles par défaut
db.ROLES = ["user", "admin", "moderator"]; // <--- AJOUTEZ CETTE LIGNE

module.exports = db;