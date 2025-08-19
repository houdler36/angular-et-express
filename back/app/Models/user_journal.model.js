module.exports = (sequelize, Sequelize) => {
  // Définition du modèle pour la table de liaison user_journals.
  // La table de la base de données contient déjà les horodatages.
  const UserJournal = sequelize.define("user_journals", {
    userId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      references: {
        model: 'users', // Nom de la table source
        key: 'id' // Nom de la clé primaire de la table source
      }
    },
    journalId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      references: {
        model: 'journals', // Nom de la table source
        key: 'id_journal' // Nom de la clé primaire de la table source
      }
    },
  }, {
    // En supprimant 'timestamps: false', Sequelize gère automatiquement
    // les colonnes 'createdAt' et 'updatedAt' qui existent déjà dans votre table.
  });

  return UserJournal;
};
