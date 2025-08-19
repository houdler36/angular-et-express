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
    freezeTableName: true,
    tableName: 'journal' // facultatif si freezeTableName=true
  });

  Journal.associate = (models) => {
    // Association Many-to-Many avec User via JournalValider
    Journal.belongsToMany(models.User, {
      through: models.JournalValider,
      foreignKey: 'journal_id',
      otherKey: 'user_id',
      as: 'valideurs' // alias utilisé pour les includes
    });

    // Association Many-to-Many avec Budget
    Journal.belongsToMany(models.Budget, {
      through: 'journal_budgets', // nom exact de la table de jointure
      foreignKey: 'journal_id',
      otherKey: 'id_budget',
      as: 'budgets' // alias utilisé pour les includes
    });
  };

  return Journal;
};
