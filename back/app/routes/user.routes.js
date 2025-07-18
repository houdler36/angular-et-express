const express = require('express');
const router = express.Router();
const db = require('../Models'); // Import correct de la base de données
const User = db.user; // Accès au modèle User

// Route de test
router.get('/test', async (req, res) => {
  try {
    // Vérification que le modèle est bien chargé
    if (!User || !User.findAll) {
      throw new Error('User model not properly initialized');
    }
    
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role']
    });
    res.json({ status: 'OK', users });
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ 
      status: 'Error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;