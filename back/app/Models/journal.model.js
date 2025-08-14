module.exports = (sequelize, DataTypes) => {
  const Journal = sequelize.define('journal', {
    id_journal: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nom_journal: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nom_projet: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    freezeTableName: true
  });

  // Association Many-to-Many avec User via JournalValider
  Journal.associate = (models) => {
    Journal.belongsToMany(models.User, {
      through: models.JournalValider,
      foreignKey: 'journal_id',
      otherKey: 'user_id',
      as: 'valideurs'
    });

    // Si tu as une association avec Budget (exemple)
    Journal.belongsToMany(models.Budget, {
      through: 'journal_budgets', // adapte le nom si différent
      foreignKey: 'journal_id',
      otherKey: 'id_budget',
      as: 'budgets'
    });
  };

  return Journal;
};
