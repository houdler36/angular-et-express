const express = require('express');
const router = express.Router();
const uploadController = require('../Controllers/upload.controller');
const authJwt = require('../middleware/authJwt');
const cors = require('cors');

const corsOptions = {
  origin: 'http://localhost:4200',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Autoriser les requêtes preflight
router.options('/upload-signature', cors(corsOptions));

// Route sécurisée avec JWT
router.post(
  '/upload-signature',
  cors(corsOptions),
  authJwt.verifyToken,         // Vérifie que l'utilisateur est authentifié
  uploadController.upload,     // Middleware multer pour gérer le fichier
  uploadController.uploadSignature // Contrôleur pour sauvegarder la signature
);

module.exports = router;
