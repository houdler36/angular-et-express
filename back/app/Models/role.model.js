// app/models/role.model.js
module.exports = (sequelize, Sequelize) => { // <-- Changez 'DataTypes' en 'Sequelize'
  const Role = sequelize.define("roles", { // Il est courant de nommer la table au pluriel et le modèle au singulier
    id: { // Ajoutez un ID si votre modèle de rôle en a un
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING, // <-- Utilisez Sequelize.STRING
      unique: true,
      allowNull: false
    }
  });

  return Role;
};