module.exports = (sequelize, DataTypes) => {
  const Journal = sequelize.define('journal', {
    // Définissez id_journal comme clé primaire
    id_journal: {
      type: DataTypes.INTEGER,
      primaryKey: true, // <-- Indique à Sequelize que c'est la clé primaire
      autoIncrement: true // <-- Indique que c'est une colonne auto-incrémentée
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
    // Cela empêche Sequelize de créer une colonne 'id' et de mettre le nom de la table au pluriel
    freezeTableName: true
  });
  return Journal;
};