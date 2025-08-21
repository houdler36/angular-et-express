const db = require("../Models");
const User = db.user;
const Journal = db.journal;
const JournalValider = db.journal_valider;
const Op = db.Sequelize.Op;

const bcrypt = require("bcryptjs");

// Rôles autorisés à être validateurs
const rolesValideurs = ["rh", "daf", "approver"];

// ✅ Ajout de signature_image_url dans la création d'un utilisateur
exports.createAdminUser = async (req, res) => {
  try {
    const { username, email, password, role, journalIds, signature_image_url } = req.body;
    console.log("Données reçues :", req.body);

    // Vérifier si le rôle est valide
    if (!db.ROLES.includes(role)) {
      return res.status(400).json({ message: "Le rôle spécifié n'est pas valide !" });
    }

    // Vérifier unicité du username/email
    const existingUser = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] }
    });
    if (existingUser) {
      return res.status(400).json({ message: "Le nom d'utilisateur ou email existe déjà !" });
    }

    // Créer l'utilisateur
    const user = await User.create({
      username,
      email,
      password: bcrypt.hashSync(password, 8),
      role,
      signature_image_url // ✅ Ajout du champ signature_image_url
    });
    console.log("Utilisateur créé :", user.username, "Rôle :", user.role);

    // Associer l'utilisateur à tous les journaux sélectionnés (peu importe le rôle)
    if (Array.isArray(journalIds) && journalIds.length > 0) {
      const journals = await Journal.findAll({
        where: { id_journal: { [Op.in]: journalIds } }
      });
      if (journals.length > 0) {
        await user.setJournals(journals);
        console.log(`Utilisateur ${user.username} associé aux journaux :`, journals.map(j => j.nom_journal));
      }
    }

    res.status(201).json({
      message: "Utilisateur créé et associé aux journaux avec succès.",
      user: { id: user.id, username: user.username, email: user.email, role: user.role, signature_image_url: user.signature_image_url }
    });

  } catch (error) {
    console.error("Erreur lors de createAdminUser :", error);
    res.status(500).json({ message: "Erreur lors de la création de l’utilisateur." });
  }
};


// ✅ Ajout de signature_image_url dans la récupération de tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "email", "role", "signature_image_url"],
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
      // ✅ Ajout de signature_image_url
      attributes: ["id", "username", "email", "role", "signature_image_url"],
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
      // ✅ Ajout de signature_image_url
      attributes: ["id", "username", "email", "role", "signature_image_url"],
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

// ✅ Mise à jour de l'utilisateur pour inclure signature_image_url
exports.updateUser = async (req, res) => {
  try {
    const { username, email, password, role, journalIds, signature_image_url } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    // Mettre à jour les champs
    user.username = username || user.username;
    user.email = email || user.email;
    if (password) user.password = bcrypt.hashSync(password, 8);
    user.role = role || user.role;
    user.signature_image_url = signature_image_url !== undefined ? signature_image_url : user.signature_image_url;

    await user.save();

    // Mettre à jour les journaux associés si fournis
    if (Array.isArray(journalIds)) {
      const journals = await Journal.findAll({
        where: { id_journal: { [Op.in]: journalIds } }
      });
      await user.setJournals(journals);
    }

    res.status(200).json({ message: "Utilisateur mis à jour avec succès.", user });
  } catch (error) {
    console.error("Erreur lors de updateUser :", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de l’utilisateur." });
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    await user.destroy();
    res.status(200).json({ message: "Utilisateur supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de deleteUser :", error);
    res.status(500).json({ message: "Erreur lors de la suppression de l’utilisateur." });
  }
};


// Fonctions de test d'accès
exports.allAccess = (req, res) => res.status(200).send("Public Content.");
exports.userBoard = (req, res) => res.status(200).send("User Content.");
exports.adminBoard = (req, res) => res.status(200).send("Admin Content.");
exports.isApproverOrAdminOrRhOrDafOrCaissierBoard = (req, res) =>
  res.status(200).send("Approver, Admin, Rh, Daf, or Caissier Content.");
