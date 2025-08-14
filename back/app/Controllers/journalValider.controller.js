const db = require('../Models');
const JournalValider = db.journal_valider;
const Demande = db.demandes;

exports.getValidateursByJournal = async (req, res) => {
  try {
    const journalId = req.params.journalId;
    const valideurs = await JournalValider.findAll({
      where: { journal_id: journalId },
      include: [{ model: db.User, attributes: ['id', 'username', 'role'] }],
      order: [['ordre', 'ASC']],
    });
    res.status(200).json(valideurs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des validateurs.' });
  }
};

exports.validateDemande = async (req, res) => {
  try {
    const demandeId = req.params.demandeId;
    const userId = req.userId;  // récupéré via authJwt.verifyToken middleware
    const { statut, commentaire } = req.body; // 'validé' ou 'refusé'

    // Vérifier que la demande existe
    const demande = await Demande.findByPk(demandeId);
    if (!demande) return res.status(404).json({ message: 'Demande non trouvée.' });

    // Récupérer validateur correspondant à cet utilisateur et ce journal, statut en attente
    const valider = await JournalValider.findOne({
      where: {
        journal_id: demande.journal_id,
        user_id: userId,
        statut: 'en attente',
      }
    });

    if (!valider) return res.status(403).json({ message: "Vous ne pouvez pas valider/refuser cette demande." });

    // Mettre à jour la validation
    valider.statut = statut;
    valider.commentaire = commentaire;
    valider.date_validation = new Date();
    await valider.save();

    if (statut === 'refusé') {
      demande.status = 'refusée';
      await demande.save();
      return res.json({ message: 'Demande refusée.' });
    }

    // Trouver validateur suivant
    const nextValider = await JournalValider.findOne({
      where: {
        journal_id: demande.journal_id,
        ordre: valider.ordre + 1,
        statut: 'en attente',
      }
    });

    if (nextValider) {
      // La demande passe au validateur suivant (reste en attente)
      return res.json({ message: 'Validé, la demande est envoyée au validateur suivant.' });
    } else {
      // Dernier validateur, demande validée
      demande.status = 'validée';
      await demande.save();
      return res.json({ message: 'Demande validée par tous les validateurs.' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
