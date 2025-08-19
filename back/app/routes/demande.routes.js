// Fichier: routes/demande.routes.js
const express = require('express');
const router = express.Router();
const demandeController = require('../Controllers/demande.controller');
const { verifyToken } = require('../middleware/authJwt');

// ─── Routes spécifiques ─────────────────────────────────────

// Récupérer les demandes à valider pour l'utilisateur connecté (RH-only)
router.get('/avalider', verifyToken, demandeController.getDemandesAValider);

// Récupérer les demandes en attente chez un autre validateur (RH-only)
router.get('/enattenteautres', verifyToken, demandeController.getDemandesEnAttenteAutres);

// Récupérer les demandes finalisées
router.get('/finalisees', verifyToken, demandeController.getDemandesFinalisees);

// Statistiques générales des demandes
router.get('/stats/general', verifyToken, demandeController.getDemandeStats);

// ─── Routes par ID ────────────────────────────────────────

// Création d'une demande
router.post('/', verifyToken, demandeController.create);

// Récupération d'une demande par ID
router.get('/:id', verifyToken, demandeController.findOne);

// Mise à jour d'une demande
router.put('/:id', verifyToken, demandeController.update);

// Suppression d'une demande
router.delete('/:id', verifyToken, demandeController.delete);

// Validation et refus d'une demande (RH-only)
router.put('/:id/valider', verifyToken, demandeController.validerDemande);
router.put('/:id/refuser', verifyToken, demandeController.refuserDemande);

// ─── Routes générales ────────────────────────────────────

// Si tu veux récupérer toutes les demandes de l’utilisateur connecté,
// tu peux utiliser la route `/avalider` ou créer une fonction spécifique dans le controller.
// Pour l'instant, on redirige `/` vers les demandes finalisées
router.get('/', verifyToken, demandeController.getDemandesFinalisees);

module.exports = router;
