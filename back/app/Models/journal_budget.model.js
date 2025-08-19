// Fichier: app/models/journal_budget.model.js
// Table de jointure pour la relation Many-to-Many entre Journal et Budget

module.exports = (sequelize, DataTypes) => {
  const JournalBudget = sequelize.define('journal_budget', {
    // Clé étrangère vers Journal.id_journal
    journal_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'journal',
        key: 'id_journal'
      }
    },
    // Clé étrangère vers Budget.id_budget
    id_budget: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'budget',
        key: 'id_budget'
      }
    }
  }, {
    freezeTableName: true,
    timestamps: false
  });

  return JournalBudget;
};
