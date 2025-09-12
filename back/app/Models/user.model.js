const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    // Nom d'utilisateur
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { notEmpty: true, len: [3, 30] }
    },

    // Email
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { isEmail: true, notEmpty: true }
    },

    // Mot de passe
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [8, 100] }
    },

    // Rôle de l'utilisateur
    role: {
      type: DataTypes.ENUM('admin', 'user', 'rh', 'daf', 'caissier'),
      defaultValue: 'user',
      allowNull: false
    },

    // URL de la signature
    signature_image_url: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // ID du remplaçant RH
    delegue_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL"
    }
  }, {
    timestamps: false,
    paranoid: true,
    tableName: 'users',
    defaultScope: { attributes: { exclude: ['password'] } },
    scopes: { withPassword: { attributes: {} } }
  });

  // Méthode pour vérifier le mot de passe
  User.prototype.verifyPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };

  // Associations
  User.associate = (models) => {
    // Relation N-N avec Journal
    User.belongsToMany(models.Journal, {
      through: models.JournalValider,
      foreignKey: 'user_id',
      otherKey: 'journal_id',
      as: 'journaux_a_valider'
    });

    // RH délégué
    User.belongsTo(models.User, {
      as: "delegue",
      foreignKey: "delegue_id"
    });

    // RH remplacés par cet utilisateur
    User.hasMany(models.User, {
      as: "remplaces",
      foreignKey: "delegue_id"
    });
  };

  return User;
};
