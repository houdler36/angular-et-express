// C:\Users\WINDOWS 10\Desktop\Houlder\back\app\config\db.config.js

module.exports = {
    HOST: "localhost", // Ou votre hôte de base de données
    USER: "root",      // Votre utilisateur de base de données
    PASSWORD: "",      // Votre mot de passe de base de données (si vide, laissez vide)
    DB: "auth_db",     // Le nom de votre base de données
    dialect: "mysql",  // Le dialecte de votre base de données (mysql, postgres, etc.)
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};