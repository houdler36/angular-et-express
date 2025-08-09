// Fichier : app/routes/budget.routes.js
const express = require('express');
const router = express.Router();
const budgetController = require('../Controllers/budget.controller');
const { authJwt } = require("../middleware"); // Assurez-vous du chemin correct

router.use(function(req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

// Les chemins sont maintenant relatifs au point de montage /api/budgets
router.post('/', [authJwt.verifyToken, authJwt.isAdmin], budgetController.create); // URL: /api/budgets
router.get('/current-year', [authJwt.verifyToken, authJwt.isAdmin], budgetController.findAllCurrentYear); // URL: /api/budgets/current-year
router.get('/all', [authJwt.verifyToken, authJwt.isAdmin], budgetController.findAll); // URL: /api/budgets/all

module.exports = router;