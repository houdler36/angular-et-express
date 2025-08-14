// Fichier : app/routes/journal.routes.js
const express = require('express');
const router = express.Router();
const journalController = require('../Controllers/journal.controller'); // Assurez-vous du chemin correct
const { authJwt } = require("../middleware"); // Assurez-vous du chemin correct

// Ce middleware permet de gérer les en-têtes CORS pour toutes les routes de ce routeur.
router.use(function(req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

// Les chemins sont maintenant relatifs au point de montage /api/journals

// Route pour les utilisateurs simples : récupère uniquement les journaux qui leur sont associés.
// Le middleware authJwt.verifyToken est utilisé pour identifier l'utilisateur.
router.get('/all', authJwt.verifyToken, authJwt.isAdmin, journalController.findAll);


// Route pour les administrateurs : récupère tous les journaux de la base de données.
// Elle est protégée par les middlewares verifyToken et isAdmin.
router.get('/all', [authJwt.verifyToken, authJwt.isAdmin], journalController.findAll);

// Route pour la création d'un journal : réservée aux administrateurs.
// Elle est protégée par les middlewares verifyToken et isAdmin.
router.post('/', [authJwt.verifyToken, authJwt.isAdmin], journalController.create);

module.exports = router;
