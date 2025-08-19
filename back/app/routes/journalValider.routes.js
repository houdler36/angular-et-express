const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authJwt'); // vérifier le chemin exact
const journalValiderController = require('../Controllers/journalValider.controller');

// Récupérer les validateurs pour un journal
router.get(
  '/journal/:journalId/validateurs',
  verifyToken,
  journalValiderController.getValidateursByJournal
);

// Valider ou refuser une demande
router.post(
  '/demandes/:demandeId/validate',
  verifyToken,
  journalValiderController.validateDemande
);

module.exports = router;
