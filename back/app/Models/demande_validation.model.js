// models/demande_validation.model.js
module.exports = (sequelize, Sequelize) => {
  const DemandeValidation = sequelize.define("demande_validation", {
    statut: {
      type: Sequelize.STRING,
      defaultValue: 'en attente'
    },
    ordre: {
      type: Sequelize.INTEGER,
      defaultValue: 1
    },
    date_validation: {
      type: Sequelize.DATE
    },
    commentaire: {
      type: Sequelize.TEXT
    },
    signature_image_url: {
      type: Sequelize.STRING
    }
  });
  return DemandeValidation;
};