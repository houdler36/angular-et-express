// models/user.js

const bcrypt = require('bcrypt'); // Assurez-vous d'avoir bcrypt pour la vérification du mot de passe

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    // Le champ 'id' est généralement ajouté automatiquement par Sequelize
    // si vous ne le définissez pas explicitement comme clé primaire auto-incrémentée.
    // Si vous souhaitez être explicite, vous pouvez l'ajouter ici :
    // id: {
    //   type: DataTypes.INTEGER,
    //   primaryKey: true,
    //   autoIncrement: true
    // },
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
    // Le champ isActive a été supprimé d'ici
    // isActive: {
    //   type: DataTypes.BOOLEAN,
    //   defaultValue: true
    // }
  }, {
    timestamps: false, // Active createdAt et updatedAt (qui seront automatiquement gérés par Sequelize)
    paranoid: true,   // Active deletedAt (soft delete), qui sera aussi automatiquement géré
    tableName: 'users', // Nom explicite de la table
    defaultScope: {
      attributes: { exclude: ['password'] } // Exclut le mot de passe par défaut
    },
    scopes: {
      withPassword: {
        attributes: {} // Inclut le mot de passe quand nécessaire
      }
    }
  });

  // Méthodes d'instance (sans middleware)
  // Assurez-vous que 'bcrypt' est bien importé en haut du fichier si vous utilisez cette méthode.
  User.prototype.verifyPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };

  return User;
};