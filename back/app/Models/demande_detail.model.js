// app/models/demande_detail.model.js

module.exports = (sequelize, Sequelize) => {
    const DemandeDetail = sequelize.define("demande_details", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        demande_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        nature: {
            type: Sequelize.ENUM('appro', 'charge', 'produits', 'autre'),
            allowNull: false,
        },
        libelle: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
        },
        beneficiaire: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        nif_exists: {
            type: Sequelize.ENUM('oui', 'non'),
            allowNull: false,
            defaultValue: 'non',
        },
        numero_compte: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        budget_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        status_detail: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: 'en attente',
        },
    }, {
        timestamps: false,
        tableName: 'demande_details'
    });

    return DemandeDetail;
};
