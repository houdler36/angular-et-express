// Fichier : C:\Users\WINDOWS 10\Desktop\Houlder\back\app\controllers\user.controller.js

const db = require("../Models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;
const Journal = db.journal;

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

// Nouvelle fonction pour créer un utilisateur avec des journaux associés
exports.createAdminUser = async (req, res) => {
  try {
    // Vérification de la validité du rôle
    if (!db.ROLES.includes(req.body.role)) {
      return res.status(400).send({ message: "Le rôle spécifié n'est pas valide !" });
    }

    // Création du nouvel utilisateur
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      role: req.body.role // Stockage direct du rôle
    });

    // Association de l'utilisateur aux journaux si journalIds est fourni
    if (req.body.journalIds && req.body.journalIds.length > 0) {
      const journals = await Journal.findAll({
        where: {
          id_journal: { // CORRECTION: Utilise le nom de colonne correct 'id_journal'
            [Op.in]: req.body.journalIds
          }
        }
      });
      if (journals.length === 0) {
        console.log("Aucun journal trouvé pour les IDs fournis. L'utilisateur a été créé sans journaux associés.");
      } else {
        await user.setJournals(journals);
      }
    }

    res.status(200).send({ message: "Utilisateur créé avec succès et journaux associés." });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Une erreur est survenue lors de la création de l'utilisateur." });
  }
};

// Fonction pour récupérer tous les utilisateurs avec leurs journaux
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role'], // Sélection des attributs à retourner
      include: [{
        model: Journal,
        as: 'journals',
        attributes: ['id_journal', 'nom_journal'], // CORRECTION: Utilise le nom de colonne correct 'nom_journal'
        through: { attributes: [] } // Empêche l'inclusion de la table de jointure
      }]
    });
    res.status(200).send(users);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Une erreur est survenue lors de la récupération des utilisateurs." });
  }
};

// Fonction pour récupérer un utilisateur par son ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'email', 'role'],
      include: [{
        model: Journal,
        as: 'journals',
        attributes: ['id_journal', 'nom_journal'], // CORRECTION: Utilise le nom de colonne correct 'nom_journal'
        through: { attributes: [] }
      }]
    });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Fonction pour récupérer tous les journaux
exports.getJournals = async (req, res) => {
  try {
    const journals = await Journal.findAll({
      attributes: ['id_journal', 'nom_journal'] // CORRECTION: Utilise le nom de colonne correct 'nom_journal'
    });
    res.status(200).send(journals);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Une erreur est survenue lors de la récupération des journaux." });
  }
};

// Fonctions de test d'accès existantes
exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.isApproverOrAdminOrRhOrDafOrCaissierBoard = (req, res) => {
  res.status(200).send("Approver, Admin, Rh, Daf, or Caissier Content.");
};
