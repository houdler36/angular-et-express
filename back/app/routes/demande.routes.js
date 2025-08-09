const express = require('express');
const router = express.Router();

const controller = require('../Controllers/demande.controller.js');
const { authJwt } = require('../middleware');

// Debug pour vérifier que les fonctions existent
console.log('controller.update:', controller.update);
console.log('authJwt.verifyToken:', authJwt.verifyToken);

// Routes sécurisées par le token
router.post('/', [authJwt.verifyToken], controller.create);
router.get('/', [authJwt.verifyToken], controller.findAll);
router.get('/:id', [authJwt.verifyToken], controller.findOne);
router.put('/:id', [authJwt.verifyToken], controller.update);
router.delete('/:id', [authJwt.verifyToken], controller.delete);
router.delete('/', [authJwt.verifyToken], controller.deleteAll);
router.patch('/:id/status', [authJwt.verifyToken], controller.updateDemandeStatus);
router.get('/stats/general', [authJwt.verifyToken], controller.getDemandeStats);

module.exports = router;
