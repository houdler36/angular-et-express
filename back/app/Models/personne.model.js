module.exports = (sequelize, DataTypes) => {
  const Personne = sequelize.define("personnes", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false
    },
    poste: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    // Cela garantit que Sequelize utilise le nom 'personnes' et non 'personne'
    tableName: 'personnes'
  });
  return Personne;
};