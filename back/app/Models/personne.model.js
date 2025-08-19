// app/models/personne.model.js
module.exports = (sequelize, DataTypes) => {
    const Personne = sequelize.define('personne', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom: {
            type: DataTypes.STRING,
            allowNull: false
        },
        prenom: {
            type: DataTypes.STRING,
            allowNull: true
        },
        poste: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        freezeTableName: true, // empêche Sequelize de mettre le nom de la table au pluriel
        timestamps: false
    });
    return Personne;
};
