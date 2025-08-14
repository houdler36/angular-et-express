const db = require("../Models");
const User = db.user;
const Journal = db.journal;
const Op = db.Sequelize.Op;
const bcrypt = require("bcryptjs");

// Créer un utilisateur admin avec journaux associés
exports.createAdminUser = async (req, res) => {
  try {
    if (!db.ROLES.includes(req.body.role)) {
      return res.status(400).send({ message: "Le rôle spécifié n'est pas valide !" });
    }

    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      role: req.body.role,
    });

    if (req.body.journalIds && req.body.journalIds.length > 0) {
      const journals = await Journal.findAll({
        where: {
          id_journal: {
            [Op.in]: req.body.journalIds,
          },
        },
      });
      if (journals.length > 0) {
        await user.setJournals(journals);
      }
    }

    res.status(200).send({ message: "Utilisateur créé avec succès et journaux associés." });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Une erreur est survenue lors de la création de l'utilisateur." });
  }
};

// Récupérer tous les utilisateurs (sans filtre)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "email", "role"],
      include: [{
        model: Journal,
        as: "journals",
        attributes: ["id_journal", "nom_journal"],
        through: { attributes: [] }
      }]
    });
    res.status(200).send(users);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Erreur lors de la récupération des utilisateurs." });
  }
};

// Récupérer uniquement les utilisateurs RH
exports.getAllRhUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: "rh" },
      attributes: ["id", "username", "email", "role"],
      include: [{
        model: Journal,
        as: "journals",
        attributes: ["id_journal", "nom_journal"],
        through: { attributes: [] }
      }]
    });
    res.status(200).send(users);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Erreur lors de la récupération des utilisateurs RH." });
  }
};

// Récupérer un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ["id", "username", "email", "role"],
      include: [{
        model: Journal,
        as: "journals",
        attributes: ["id_journal", "nom_journal"],
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

// Récupérer tous les journaux
exports.getJournals = async (req, res) => {
  try {
    const journals = await Journal.findAll({
      attributes: ["id_journal", "nom_journal"]
    });
    res.status(200).send(journals);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Erreur lors de la récupération des journaux." });
  }
};

// Fonctions de test d'accès
exports.allAccess = (req, res) => res.status(200).send("Public Content.");
exports.userBoard = (req, res) => res.status(200).send("User Content.");
exports.adminBoard = (req, res) => res.status(200).send("Admin Content.");
exports.isApproverOrAdminOrRhOrDafOrCaissierBoard = (req, res) => 
  res.status(200).send("Approver, Admin, Rh, Daf, or Caissier Content.");
