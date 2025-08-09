const demandeDetailsModel = (sequelize, Sequelize) => {
    const DemandeDetails = sequelize.define("demande_details", {
        // La colonne 'id' est la clé primaire, auto-incrémentée
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        // 'demande_id' est la clé étrangère de la demande associée
        demande_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        // 'nature' est un ENUM, comme défini dans le SQL
        nature: {
            type: Sequelize.ENUM('appro', 'charge', 'produits', 'autre'),
            allowNull: false,
        },
        // 'libelle' est une chaîne de caractères obligatoire
        libelle: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        // 'beneficiaire' est une chaîne de caractères
        beneficiaire: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        // 'amount' est un décimal, ce qui correspond à un montant
        amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
        },
        // 'nif_exists' est un ENUM, comme défini dans le SQL
        nif_exists: {
            type: Sequelize.ENUM('oui', 'non'),
            allowNull: false,
            defaultValue: 'non',
        },
        // 'numero_compte' est une chaîne de caractères optionnelle
        numero_compte: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        // 'budget_id' est la colonne budgétaire, pas 'code_budgetaire'
        budget_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        // 'status_detail' est une chaîne de caractères avec une valeur par défaut
        status_detail: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: 'en attente',
        },
    }, {
        // Désactiver les timestamps 'createdAt' et 'updatedAt' pour correspondre à la base de données
        timestamps: false,
        // On s'assure que le modèle utilise le bon nom de table
        tableName: 'demande_details'
    });

    return DemandeDetails;
};

module.exports = demandeDetailsModel;
