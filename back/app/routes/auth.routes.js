// C:\Users\WINDOWS 10\Desktop\Houlder\back\app\routes\auth.routes.js

// CORRECTION ICI : Importez directement les fichiers middleware
const verifySignUp = require("../middleware/verifySignup"); // Importe verifySignup.js
const authJwt = require("../middleware/authJwt");         // Importe authJwt.js

const controller = require("../controllers/auth.controller");
const express = require("express");
const router = express.Router();

// Middleware pour définir les en-têtes CORS (si nécessaire, sinon retirez)
router.use(function(req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

// Routes d'authentification
router.post(
  "/signup", // sera '/api/auth/signup'
  [
    verifySignUp.checkDuplicateUsernameOrEmail, // Utilisez directement les fonctions exportées
    verifySignUp.checkRolesExisted
  ],
  controller.signup
);

router.post("/signin", controller.signin);

// Exemple de route protégée (si vous en avez dans auth.routes)
// router.get("/test-auth", [authJwt.verifyToken], (req, res) => res.send("Protected content"));


module.exports = router; // EXPORTEZ LE ROUTEUR