module.exports = (sequelize, Sequelize) => {
  const JournalValider = sequelize.define('journal_valider', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    journal_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    ordre: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    statut: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'en attente',
    },
    date_validation: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    commentaire: {
      type: Sequelize.TEXT,
      allowNull: true,
    }
  }, {
    timestamps: true,
    tableName: 'journal_validers',
  });

  JournalValider.associate = (models) => {
    JournalValider.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    JournalValider.belongsTo(models.Journal, {
      foreignKey: 'journal_id',
      as: 'journal'
    });
  };

  return JournalValider;
};
