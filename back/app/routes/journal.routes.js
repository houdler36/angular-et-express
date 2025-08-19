// Fichier : app/routes/journal.routes.js
const express = require('express');
const router = express.Router();
const journalController = require('../Controllers/journal.controller');
const { authJwt } = require("../middleware");

// CORS headers pour toutes les routes
router.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

// ─── Routes Journaux ──────────────────────────

// Récupérer tous les journaux (admin uniquement)
router.get('/all', [authJwt.verifyToken, authJwt.isAdmin], journalController.findAll);

// Récupérer un journal par ID (admin uniquement)
router.get('/:id', [authJwt.verifyToken, authJwt.isAdmin], journalController.findOne);

// Créer un journal (admin uniquement)
router.post('/', [authJwt.verifyToken, authJwt.isAdmin], journalController.create);

// Mettre à jour un journal (admin uniquement)
router.put('/:id', [authJwt.verifyToken, authJwt.isAdmin], journalController.update);

// Supprimer un journal (admin uniquement)
router.delete('/:id', [authJwt.verifyToken, authJwt.isAdmin], journalController.delete);

module.exports = router;
