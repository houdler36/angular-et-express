const express = require('express');
const router = express.Router();
const { authJwt } = require('../middleware');
const journalValiderController = require('../Controllers/journalValider.controller');

// Récupérer validateurs pour un journal
router.get('/journal/:journalId/validateurs', [authJwt.verifyToken], journalValiderController.getValidateursByJournal);

// Valider ou refuser une demande par un validateur
router.post('/demandes/:demandeId/validate', [authJwt.verifyToken], journalValiderController.validateDemande);

module.exports = router;
