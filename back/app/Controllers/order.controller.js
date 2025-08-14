// controllers/order.controller.js
const db = require("../Models");
const JournalValider = db.journal_valider;
const Demande = db.demande;

exports.validerDemande = async (req, res) => {
  const { demandeId, userId, commentaire } = req.body;

  try {
    const demande = await Demande.findByPk(demandeId);
    if (!demande) return res.status(404).json({ message: "Demande non trouvée" });

    const validateurs = await JournalValider.findAll({
      where: { journal_id: demande.journal_id },
      order: [['ordre', 'ASC']],
    });

    if (validateurs.length === 0) {
      return res.status(400).json({ message: "Aucun validateur configuré" });
    }

    const validateurCourant = validateurs.find(v => v.statut === 'en attente');
    if (!validateurCourant) {
      return res.status(400).json({ message: "Validation déjà terminée" });
    }

    if (validateurCourant.user_id !== userId) {
      return res.status(403).json({ message: "Ce n’est pas votre tour de valider" });
    }

    validateurCourant.statut = 'validée';
    validateurCourant.date_validation = new Date();
    validateurCourant.commentaire = commentaire || null;
    await validateurCourant.save();

    const resteEnAttente = validateurs.some(v => v.statut === 'en attente');
    if (!resteEnAttente) {
      demande.status = 'validée';
      await demande.save();
    }

    return res.status(200).json({
      message: "Validation enregistrée",
      demandeStatus: demande.status,
      validateur: validateurCourant,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
