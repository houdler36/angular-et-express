// Fichier: app/models/budget.model.js
module.exports = (sequelize, DataTypes) => {
  const Budget = sequelize.define('budget', {
    // Définissez id_budget comme clé primaire
    id_budget: {
      type: DataTypes.INTEGER,
      primaryKey: true,       // <-- Indique à Sequelize que c'est la clé primaire
      autoIncrement: true     // <-- Indique que c'est une colonne auto-incrémentée
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    code_budget: {
      type: DataTypes.STRING,
      allowNull: false
    },
    annee_fiscale: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    budget_annuel: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    budget_trimestre_1: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    budget_trimestre_2: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    budget_trimestre_3: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    budget_trimestre_4: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    }
  }, {
    // Cela empêche Sequelize de créer une colonne 'id' supplémentaire
    // et de mettre le nom de la table au pluriel ('budgets')
    freezeTableName: true,
    // Si vous n'utilisez pas les timestamps par défaut de Sequelize (createdAt, updatedAt)
    // timestamps: false
  });
  return Budget;
};