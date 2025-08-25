const controller = require("../Controllers/stats.controller");
const express = require('express');
const router = express.Router();

// The path here should be the relative path
router.get("/", controller.getDashboardStats);

module.exports = router;