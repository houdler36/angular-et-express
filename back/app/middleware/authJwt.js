const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const db = require("../Models");
const User = db.user;

const verifyToken = (req, res, next) => {
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
    console.log("Utilisateur connecté (req.userId) :", req.userId);
    next();
  });
};

const isAdmin = (req, res, next) => {
  User.findByPk(req.userId)
    .then(user => {
      if (user && user.role === "admin") {
        next();
        return;
      }
      res.status(403).send({ message: "Requiert le rôle d'Admin !" });
    })
    .catch(err => {
      res.status(500).send({ message: err.message || "Erreur lors de la récupération de l'utilisateur." });
    });
};

const isUser = (req, res, next) => {
  User.findByPk(req.userId)
    .then(user => {
      if (user && user.role === "user") {
        next();
        return;
      }
      res.status(403).send({ message: "Requiert le rôle d'utilisateur !" });
    })
    .catch(err => {
      res.status(500).send({ message: err.message || "Erreur lors de la récupération de l'utilisateur." });
    });
};

const isRhOrAdmin = (req, res, next) => {
  User.findByPk(req.userId)
    .then(user => {
      if (user && ["admin", "rh"].includes(user.role)) {
        next();
        return;
      }
      res.status(403).send({ message: "Requiert le rôle d'Admin ou RH !" });
    })
    .catch(err => {
      res.status(500).send({ message: err.message || "Erreur lors de la récupération de l'utilisateur." });
    });
};

const isApproverOrAdminOrRhOrDafOrCaissier = (req, res, next) => {
  User.findByPk(req.userId)
    .then(user => {
      if (user && ["approver", "admin", "rh", "daf", "caissier"].includes(user.role)) {
        next();
        return;
      }
      res.status(403).send({ message: "Requiert un rôle spécifique (Approver, Admin, RH, DAF, Caissier)!" });
    })
    .catch(err => {
      res.status(500).send({ message: err.message || "Erreur lors de la récupération de l'utilisateur." });
    });
};

module.exports = {
  verifyToken,
  isAdmin,
  isUser,
  isRhOrAdmin,
  isApproverOrAdminOrRhOrDafOrCaissier
};
