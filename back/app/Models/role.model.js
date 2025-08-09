// app/models/role.model.js
module.exports = (sequelize, DataTypes) => { // <-- Correction ici: utilisez DataTypes
  const Role = sequelize.define("roles", { // Il est courant de nommer la table au pluriel et le modèle au singulier
    id: { // Ajoutez un ID si votre modèle de rôle en a un
      type: DataTypes.INTEGER, // <-- Correction ici: utilisez DataTypes.INTEGER
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING, // <-- Correction ici: utilisez DataTypes.STRING
      unique: true,
      allowNull: false
    }
  });

  return Role;
};
