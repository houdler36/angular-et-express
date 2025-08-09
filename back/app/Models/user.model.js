// app/models/user.model.js

// Utilisez bcryptjs pour la cohérence avec auth.controller.js
const bcrypt = require('bcryptjs'); // <-- Correction ici

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 30]
      }
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [8, 100] // Minimum 8 caractères
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'rh', 'daf', 'caissier'),
      defaultValue: 'user',
      allowNull: false
    }
  }, {
    timestamps: false, // Désactive createdAt et updatedAt (si vous ne les voulez pas)
    paranoid: true,    // Active deletedAt (soft delete) si vous le souhaitez
    tableName: 'users', // Nom explicite de la table dans la base de données
    defaultScope: {
      attributes: { exclude: ['password'] } // Exclut le mot de passe par défaut lors des requêtes find
    },
    scopes: {
      withPassword: {
        attributes: {} // Inclut le mot de passe quand le scope 'withPassword' est utilisé
      }
    }
  });

  // Méthodes d'instance pour vérifier le mot de passe
  User.prototype.verifyPassword = function(password) {
    // Utilisez bcryptjs.compareSync pour la cohérence
    return bcrypt.compareSync(password, this.password);
  };

  return User;
};
