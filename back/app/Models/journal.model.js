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
    },
    // Nouveau champ solde
    solde: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    }
  }, {
    freezeTableName: true,
    tableName: 'journal'
  });

  Journal.associate = (models) => {
    // Association Many-to-Many avec User via JournalValider
    Journal.belongsToMany(models.User, {
      through: models.JournalValider,
      foreignKey: 'journal_id',
      otherKey: 'user_id',
      as: 'valideurs'
    });

    // Association Many-to-Many avec Budget
    Journal.belongsToMany(models.Budget, {
      through: 'journal_budgets',
      foreignKey: 'journal_id',
      otherKey: 'id_budget',
      as: 'budgets'
    });
  };

  return Journal;
};