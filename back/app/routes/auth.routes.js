const express = require('express');
const router = express.Router(); // Utilisez express.Router()

// Importation du middleware de vérification d'inscription
const { checkDuplicateUsernameOrEmail } = require("../middleware/verifySignup");

// Importation du contrôleur d'authentification
const controller = require("../controllers/auth.controller");

// --- Lignes de DÉBOGAGE (à retirer une fois le problème résolu) ---
console.log("DEBUG: Fichier app/routes/auth.routes.js chargé.");
console.log("DEBUG: Objet 'controller' après require :", controller);
console.log("DEBUG: Type de controller.signin :", typeof controller.signin);
console.log("DEBUG: Valeur de controller.signin :", controller.signin);
// --- FIN des lignes de DÉBOGAGE ---


// Middleware CORS (optionnel si déjà configuré globalement dans server.js,
// mais utile ici si vous avez des configurations CORS spécifiques à ces routes)
router.use(function(req, res, next) {
    res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
    );
    next();
});

// Routes d'authentification

// Route d'inscription (Sign-up)
router.post(
    "/signup", // Ligne 28 (environ)
    [checkDuplicateUsernameOrEmail], // Ligne 29
    controller.signup // Ligne 30 (précédemment ligne 16, maintenant ligne 30 ou 31)
);

router.post("/signin", controller.signin);
// Route de connexion (Sign-in) - C'est la ligne qui posait problème
router.post("/signin", controller.signin); // Fonction du contrôleur pour gérer la connexion

// Exportation du routeur
module.exports = router;