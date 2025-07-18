const jwt = require('jsonwebtoken');
const config = require('../Config/auth.config');

const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token'];
  
  if (!token) {
    return res.status(403).json({ message: "No token provided!" });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    next();
  });
};

// Exportez correctement l'objet
module.exports = {
  verifyToken,
  // Ajoutez d'autres middlewares si nécessaire
  isAdmin: (req, res, next) => {
    // Implémentation de la vérification admin
    if (req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: "Require Admin Role!" });
    }
  }
};