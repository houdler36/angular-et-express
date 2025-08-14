const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { notEmpty: true, len: [3, 30] }
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { isEmail: true, notEmpty: true }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [8, 100] }
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'rh', 'daf', 'caissier'),
      defaultValue: 'user',
      allowNull: false
    }
  }, {
    timestamps: false,
    paranoid: true,
    tableName: 'users',
    defaultScope: { attributes: { exclude: ['password'] } },
    scopes: { withPassword: { attributes: {} } }
  });

  User.prototype.verifyPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };

  // Association Many-to-Many avec Journal via JournalValider
  User.associate = (models) => {
    User.belongsToMany(models.Journal, {
      through: models.JournalValider,
      foreignKey: 'user_id',
      otherKey: 'journal_id',
      as: 'journaux_a_valider'
    });
  };

  return User;
};
