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
    // Signature figée stockée dès la création
    signature_validation_url: {
      type: Sequelize.TEXT, // ✅ corrigé
      allowNull: true
    },
    // Clé étrangère (utilisateur qui doit valider)
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  });

  /**
   * Hook avant la création d'une demande_validation
   * → Copie la signature actuelle de l'utilisateur
   */
  DemandeValidation.beforeCreate(async (validation, options) => {
    const User = sequelize.models.user;
    if (validation.user_id) {
      const user = await User.findByPk(validation.user_id);
      if (user && user.signature_image_url) {
        validation.signature_validation_url = user.signature_image_url; // copie figée
      }
    }
  });

  return DemandeValidation;
};
