const db = require("../Models");
const User = db.user;
const Journal = db.journal;
const Op = db.Sequelize.Op;
const bcrypt = require("bcryptjs");

// Rôles autorisés à être validateurs
const rolesValideurs = ["rh", "daf", "approver"];

// -------------------------
// ADMINISTRATION UTILISATEUR
// -------------------------

// Créer un nouvel utilisateur admin
exports.createAdminUser = async (req, res) => {
  try {
    const { username, email, password, role, journalIds, signature_image_url } = req.body;

    if (!db.ROLES.includes(role)) {
      return res.status(400).json({ message: "Le rôle spécifié n'est pas valide !" });
    }

    const existingUser = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
    if (existingUser) {
      return res.status(400).json({ message: "Le nom d'utilisateur ou email existe déjà !" });
    }

    const user = await User.create({
      username,
      email,
      password: bcrypt.hashSync(password, 8),
      role,
      signature_image_url
    });

    if (Array.isArray(journalIds) && journalIds.length > 0) {
      const journals = await Journal.findAll({ where: { id_journal: { [Op.in]: journalIds } } });
      if (journals.length > 0) await user.setJournals(journals);
    }

    res.status(201).json({
      message: "Utilisateur créé et associé aux journaux avec succès.",
      user: { id: user.id, username: user.username, email: user.email, role: user.role, signature_image_url: user.signature_image_url }
    });
  } catch (error) {
    console.error("Erreur createAdminUser :", error);
    res.status(500).json({ message: "Erreur lors de la création de l’utilisateur." });
  }
};

// Récupérer tous les utilisateurs
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
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs." });
  }
};

// Récupérer uniquement les utilisateurs RH
exports.getAllRhUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: "rh" },
      attributes: ["id", "username", "email", "role", "signature_image_url"],
      include: [{
        model: Journal,
        as: "journals",
        attributes: ["id_journal", "nom_journal"],
        through: { attributes: [] }
      }]
    });
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs RH." });
  }
};

// Récupérer un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
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

// Mettre à jour un utilisateur (admin)
exports.updateUser = async (req, res) => {
  try {
    const { username, email, password, role, journalIds, signature_image_url } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    user.username = username || user.username;
    user.email = email || user.email;
    if (password) user.password = bcrypt.hashSync(password, 8);
    user.role = role || user.role;
    if (signature_image_url !== undefined) user.signature_image_url = signature_image_url;

    await user.save();

    if (Array.isArray(journalIds)) {
      const journals = await Journal.findAll({ where: { id_journal: { [Op.in]: journalIds } } });
      await user.setJournals(journals);
    }

    res.status(200).json({ message: "Utilisateur mis à jour avec succès.", user });
  } catch (error) {
    console.error("Erreur updateUser :", error);
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
    console.error("Erreur deleteUser :", error);
    res.status(500).json({ message: "Erreur lors de la suppression de l’utilisateur." });
  }
};

// -------------------------
// PROFIL CONNECTÉ
// -------------------------
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, { // ← utiliser req.userId
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
  } catch (err) {
    console.error("Erreur getCurrentUser :", err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateCurrentUser = async (req, res) => {
  try {
    const { username, currentPassword, newPassword, signature_image_url } = req.body;

    // ⚠️ Inclure "password" ici pour comparer
    const user = await User.findByPk(req.userId, {
      attributes: ["id", "username", "email", "role", "signature_image_url", "password"]
    });

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    // Vérifier si le username est modifié
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: "Nom d'utilisateur déjà pris." });
      }
      user.username = username;
    }

    // Vérifier si changement de mot de passe
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Mot de passe actuel requis." });
      }
      const validPassword = bcrypt.compareSync(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Mot de passe actuel incorrect." });
      }
      user.password = bcrypt.hashSync(newPassword, 8);
    }

    if (signature_image_url !== undefined) user.signature_image_url = signature_image_url;

    await user.save();

    res.status(200).json({ message: "Profil mis à jour avec succès." });
  } catch (err) {
    console.error("Erreur updateCurrentUser :", err);
    res.status(500).json({ message: err.message });
  }
};

// **NOUVELLE FONCTION POUR LE CHANGEMENT DE MOT DE PASSE DU PROFIL CONNECTÉ**
exports.changePassword = async (req, res) => {
    try {
        const { newPassword, currentPassword } = req.body;
        const userId = req.userId; // L'ID de l'utilisateur est extrait du token par le middleware

        // 1. Valider que le mot de passe actuel et le nouveau sont présents
        if (!newPassword || !currentPassword) {
            return res.status(400).json({ message: "Le mot de passe actuel et le nouveau sont requis." });
        }

        // 2. Récupérer l'utilisateur avec son mot de passe
        const user = await User.findByPk(userId, { attributes: ['id', 'password'] });
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // 3. Comparer le mot de passe actuel fourni avec celui de la base de données
        const passwordIsValid = bcrypt.compareSync(currentPassword, user.password);
        if (!passwordIsValid) {
            return res.status(401).json({ message: "Mot de passe actuel incorrect." });
        }

        // 4. Hacher le nouveau mot de passe et mettre à jour l'utilisateur
        const hashedPassword = bcrypt.hashSync(newPassword, 8);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Mot de passe mis à jour avec succès." });

    } catch (err) {
        console.error("Erreur changePassword :", err);
        res.status(500).json({ message: "Erreur lors de la mise à jour du mot de passe." });
    }
};

exports.setDelegue = async (req, res) => {
  try {
    const { delegue_id } = req.body;
    const user = await db.user.findByPk(req.userId);

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    if (user.role !== "rh") return res.status(403).json({ message: "Seuls les RH peuvent définir un remplaçant." });

    if (delegue_id) {
      const delegue = await db.user.findByPk(delegue_id);
      if (!delegue || delegue.role !== "rh") {
        return res.status(400).json({ message: "Le remplaçant doit être un autre RH." });
      }
    }

    user.delegue_id = delegue_id || null;
    await user.save();

    res.status(200).json({ message: "Remplaçant mis à jour avec succès", user });
  } catch (err) {
    console.error("Erreur setDelegue:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// -------------------------
// JOURNAUX
// -------------------------

exports.getJournals = async (req, res) => {
  try {
    const journals = await Journal.findAll({
      attributes: ["id_journal", "nom_journal"]
    });
    res.status(200).json(journals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des journaux." });
  }
};

// -------------------------
// TEST ACCESS
// -------------------------

exports.allAccess = (req, res) => res.status(200).send("Public Content.");
exports.userBoard = (req, res) => res.status(200).send("User Content.");
exports.adminBoard = (req, res) => res.status(200).send("Admin Content.");
exports.isApproverOrAdminOrRhOrDafOrCaissierBoard = (req, res) =>
  res.status(200).send("Approver, Admin, Rh, Daf, or Caissier Content.");