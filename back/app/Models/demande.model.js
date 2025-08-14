// app/models/demande.model.js
// Définition du modèle 'Demande' pour la table 'demandes'
const demandeModel = (sequelize, Sequelize) => {
    const Demande = sequelize.define("demande", {
        // La colonne 'id' est la clé primaire, auto-incrémentée
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        // 'userId' est la clé étrangère de l'utilisateur, obligatoire
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        // 'type' est une énumération des types de demandes (synchronisé avec le SQL dump)
        type: {
            type: Sequelize.ENUM('DED', 'Recette'),
            defaultValue: 'DED',
            allowNull: false,
        },
        // 'journal_id' est la clé étrangère vers le journal, peut être nulle
        journal_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        // 'date' est le champ de date de la demande, obligatoire
        date: {
            type: Sequelize.DATEONLY,
            allowNull: false,
        },
        // 'expected_justification_date' peut être nulle
        expected_justification_date: {
            type: Sequelize.DATEONLY,
            allowNull: true,
        },
        // 'pj_status' est une énumération, peut être nulle
        pj_status: {
            type: Sequelize.ENUM('oui', 'pas encore'),
            defaultValue: 'pas encore',
            allowNull: true,
        },
        // 'resp_pj_id' est la clé étrangère du responsable (synchronisé avec le SQL dump)
        resp_pj_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        // 'status' est une chaîne de caractères (synchronisé avec le SQL dump)
        status: {
            type: Sequelize.STRING,
            defaultValue: 'en attente',
            allowNull: true,
        },
        // 'montant_total' est un champ décimal avec une valeur par défaut
        montant_total: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00,
            allowNull: true,
        },
        // 'description' est un champ texte, peut être nul
        description: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
    }, {
        // Désactive les timestamps pour les tables qui n'ont pas les colonnes 'createdAt' et 'updatedAt'
        timestamps: false,
        // Spécifie le nom de la table
        tableName: 'demandes'
    });

    return Demande;
};

module.exports = demandeModel;
