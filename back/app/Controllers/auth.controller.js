const db = require("../Models");
const User = db.user; // Assurez-vous que votre modèle User est correctement défini
const bcrypt = require("bcryptjs"); // Pour le hachage des mots de passe
const jwt = require("jsonwebtoken"); // Pour la génération de tokens JWT
const config = require("../config/auth.config");// Votre fichier de configuration JWT

// --- Fonction d'inscription (Sign-up) ---
exports.signup = async (req, res) => {
    console.log("DEBUG: Entrée dans la fonction signup du contrôleur !");
    try {
        // 1. Validation des entrées
        if (!req.body.username || !req.body.email || !req.body.password) {
            console.log("DEBUG: Validation signup échouée : Champs manquants.");
            return res.status(400).send({ message: "Username, email et password sont requis." });
        }

        // Hachage du mot de passe avant de le sauvegarder
        const hashedPassword = bcrypt.hashSync(req.body.password, 8);
        console.log("DEBUG: Mot de passe haché.");

        // 2. Création de l'utilisateur
        const user = await User.create({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            role: req.body.role || 'user'
        });
        console.log("DEBUG: Utilisateur créé avec succès:", user.username);

        // 3. Réponse en cas de succès
        res.status(201).send({ message: "Utilisateur enregistré avec succès !" });

    } catch (error) {
        console.error("DEBUG: Erreur dans signup:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors[0].path;
            const value = error.errors[0].value;
            return res.status(409).send({ message: `${field} '${value}' est déjà utilisé.` });
        }
        res.status(500).send({
            message: "Erreur serveur lors de l'inscription.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


exports.signin = async (req, res) => {
    console.log("DEBUG: Entrée dans la fonction signin du contrôleur !");
    try {
        // 1. Validation des entrées
        if (!req.body.username || !req.body.password) {
            console.log("DEBUG: Validation failed: Username ou password manquant.");
            return res.status(400).json({ message: "Username et password requis" });
        }
        console.log("DEBUG: Validation OK.");

        // 2. Recherche de l'utilisateur par username
        const user = await User.findOne({
            where: { username: req.body.username },
            // CORRECTION CRUCIALE : Inclure explicitement le champ 'password'
            attributes: ['id', 'username', 'email', 'role', 'password']
        });

        if (!user) {
            console.log("DEBUG: Utilisateur non trouvé:", req.body.username);
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }
        console.log("DEBUG: Utilisateur trouvé:", user.username);

        // NOUVEAUX LOGS POUR DÉBOGAGE
        console.log("DEBUG: Password from request (req.body.password):", req.body.password);
        console.log("DEBUG: Hashed password from DB (user.password):", user.password);
        console.log("DEBUG: Tentative de comparaison des mots de passe...");


        // 3. Vérification du mot de passe
        const passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password // user.password ne sera plus 'undefined'
        );

        console.log("DEBUG: Comparaison des mots de passe terminée. Valide:", passwordIsValid); // NOUVEAU LOG

        if (!passwordIsValid) {
            console.log("DEBUG: Mot de passe invalide pour l'utilisateur:", user.username);
            return res.status(401).json({
                accessToken: null,
                message: "Mot de passe invalide!"
            });
        }
        console.log("DEBUG: Mot de passe valide.");

        // 4. Génération du token JWT
        const token = jwt.sign(
            { id: user.id, role: user.role }, // Payload du token (peut inclure plus d'infos)
            config.secret, // Clé secrète depuis votre configuration
            { expiresIn: config.jwtExpiration || 86400 } // Durée de validité du token (par défaut 24h)
        );
        console.log("DEBUG: Token JWT généré.");

        // 5. Réponse de succès avec les informations de l'utilisateur et le token
        res.status(200).json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role, // Envoyez le rôle si pertinent
            accessToken: token
        });
        console.log("DEBUG: Réponse de succès envoyée.");

    } catch (error) {
        // Gestion des erreurs générales du serveur
        console.error("DEBUG: Erreur dans signin (attrapée) :", error); // Modifié pour être plus clair
        res.status(500).json({
            message: "Erreur serveur lors de la connexion.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};