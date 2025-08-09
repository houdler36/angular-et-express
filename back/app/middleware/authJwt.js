const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const db = require("../Models");
const User = db.user;
// Le modèle Role n'est pas nécessaire ici si le rôle est directement sur l'utilisateur
// const Role = db.role; 

verifyToken = (req, res, next) => {
  let token = req.headers["authorization"];

  if (!token) {
    return res.status(403).send({ message: "Pas de jeton fourni !" });
  }

  if (!token.startsWith('Bearer ')) {
    return res.status(401).send({ message: "Format de jeton invalide. Le jeton doit commencer par 'Bearer '." });
  }

  token = token.slice(7, token.length);

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Non autorisé !" });
    }
    req.userId = decoded.id;
    next();
  });
};

// CORRECTION MAJEURE ICI : Vérifie directement la propriété 'role' de l'utilisateur
isAdmin = (req, res, next) => {
  User.findByPk(req.userId)
    .then(user => {
      if (user && user.role === "admin") { // Accède directement à user.role
        next();
        return;
      }
      res.status(403).send({ message: "Requiert le rôle d'Admin !" });
    })
    .catch(err => {
      res.status(500).send({ message: err.message || "Erreur lors de la récupération de l'utilisateur." });
    });
};

// CORRECTION MAJEURE ICI : Vérifie directement la propriété 'role' de l'utilisateur
isUser = (req, res, next) => {
  User.findByPk(req.userId)
    .then(user => {
      if (user && user.role === "user") { // Accède directement à user.role
        next();
        return;
      }
      res.status(403).send({ message: "Requiert le rôle d'utilisateur !" });
    })
    .catch(err => {
      res.status(500).send({ message: err.message || "Erreur lors de la récupération de l'utilisateur." });
    });
};

// CORRECTION MAJEURE ICI : Vérifie directement la propriété 'role' de l'utilisateur
isApproverOrAdminOrRhOrDafOrCaissier = (req, res, next) => {
  User.findByPk(req.userId)
    .then(user => {
      if (user && (user.role === "approver" ||
                   user.role === "admin" ||
                   user.role === "rh" ||
                   user.role === "daf" ||
                   user.role === "caissier")) {
        next();
        return;
      }
      res.status(403).send({ message: "Requiert un rôle spécifique (Approver, Admin, RH, DAF, Caissier)!" });
    })
    .catch(err => {
      res.status(500).send({ message: err.message || "Erreur lors de la récupération de l'utilisateur." });
    });
};

const authJwt = {
  verifyToken: verifyToken,
  isAdmin: isAdmin,
  isUser: isUser,
  isApproverOrAdminOrRhOrDafOrCaissier: isApproverOrAdminOrRhOrDafOrCaissier
};

module.exports = authJwt;
