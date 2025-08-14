// routes/order.routes.js
const express = require("express");
const router = express.Router();
const orderController = require("../Controllers/order.controller");

router.post("/valider", orderController.validerDemande);

module.exports = router;
