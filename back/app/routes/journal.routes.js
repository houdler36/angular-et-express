// Fichier : app/routes/journal.routes.js
const express = require('express');
const router = express.Router();
const journalController = require('../Controllers/journal.controller'); // Assurez-vous du chemin correct
const { authJwt } = require("../middleware"); // Assurez-vous du chemin correct

router.use(function(req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

// Les chemins sont maintenant relatifs au point de montage /api/journals
router.post('/', [authJwt.verifyToken, authJwt.isAdmin], journalController.create); // URL: /api/journals
router.get('/', [authJwt.verifyToken, authJwt.isAdmin], journalController.findAll); // URL: /api/journals

module.exports = router;