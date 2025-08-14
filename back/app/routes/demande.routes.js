// Fichier: demande.routes.js

const express = require('express');
const router = express.Router();

const controller = require('../Controllers/demande.controller.js');
const { authJwt } = require('../middleware');

// Routes spécifiques
router.get('/stats/general', [authJwt.verifyToken], controller.getDemandeStats);
router.get('/avalider', [authJwt.verifyToken], controller.getDemandesAValider);
router.get('/finalisees', [authJwt.verifyToken], controller.getDemandesFinalisees); // <<-- CETTE LIGNE EST CRUCIALE
router.put('/:id/valider', [authJwt.verifyToken], controller.validerDemande);
router.patch('/:id/status', [authJwt.verifyToken], controller.updateDemandeStatus);
router.put('/:id/refuser', [authJwt.verifyToken], controller.refuserDemande);

// CRUD standard
router.post('/', [authJwt.verifyToken], controller.create);
router.get('/', [authJwt.verifyToken], controller.findAll);
router.get('/:id', [authJwt.verifyToken], controller.findOne);
router.put('/:id', [authJwt.verifyToken], controller.update);
router.delete('/:id', [authJwt.verifyToken], controller.delete);
router.delete('/', [authJwt.verifyToken], controller.deleteAll);

module.exports = router;