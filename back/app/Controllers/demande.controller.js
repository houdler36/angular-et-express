//
// app/controllers/demande.controller.js
// Contrôleur des demandes, corrigé pour utiliser des transactions Sequelize.
//
const db = require('../Models');
const Demande = db.demande;
const DemandeDetail = db.demande_detail;
const { Op } = require('sequelize');
const sequelize = db.sequelize;

/**
 * Crée une nouvelle demande avec ses détails en utilisant une transaction.
 */
exports.create = async (req, res) => {
    // Déstructuration du corps de la requête
    const {
        userId,
        type,
        subTypeDED,
        expectedJustificationDate,
        title,
        description,
        category,
        expectedDate,
        justification,
        details
    } = req.body;

    // Lancement de la transaction pour garantir l'atomicité
    const transaction = await sequelize.transaction();

    try {
        // Calcul du montant total à partir des détails
        const montantTotal = details.reduce((sum, item) => sum + parseFloat(item.amount), 0);

        // Création de l'entité Demande principale dans la transaction
        const demande = await Demande.create({
            userId,
            type,
            subTypeDED,
            expectedJustificationDate,
            title,
            description,
            amount: montantTotal,
            category,
            expectedDate,
            justification
        }, { transaction });

        // Création des détails associés à la demande
        if (details && Array.isArray(details) && details.length > 0) {
            // Ajout de l'ID de la demande parente à chaque détail
            const detailsAvecDemandeId = details.map(detail => ({
                ...detail,
                demandeId: demande.id
            }));

            // Utilisation de bulkCreate pour une insertion efficace
            await DemandeDetail.bulkCreate(detailsAvecDemandeId, { transaction });
        }

        // Validation de la transaction
        await transaction.commit();
        res.status(201).json({ message: 'Demande créée avec succès', demande });
        
    } catch (err) {
        // Annulation de la transaction en cas d'erreur
        await transaction.rollback();
        console.error("Erreur création demande:", err);
        if (err.name === 'SequelizeValidationError') {
            const errors = err.errors.map(e => e.message);
            res.status(400).json({ message: 'Erreur de validation lors de la création de la demande', errors: errors });
        } else {
            res.status(500).json({ message: 'Erreur lors de la création de la demande', error: err.message });
        }
    }
};

/**
 * Récupère toutes les demandes avec leurs détails associés.
 */
exports.findAll = async (req, res) => {
    try {
        const demandes = await Demande.findAll({
            // Spécification explicite des attributs pour éviter les erreurs de colonnes inconnues.
            include: [{ 
                model: DemandeDetail,
                as: 'details',
                attributes: [
                    'id',
                    'demande_id',
                    'nature',
                    'libelle',
                    'beneficiaire',
                    'amount',
                    'nif_exists',
                    'numero_compte',
                    'budget_id',
                    'status_detail'
                ]
            }],
            // La clause 'order' est retirée car la colonne 'createdAt' n'existe pas.
        });
        res.status(200).json(demandes);
    } catch (err) {
        console.error("Erreur findAll demandes:", err);
        res.status(500).json({ message: 'Erreur récupération demandes', error: err.message });
    }
};

/**
 * Récupère une demande par son ID.
 */
exports.findOne = async (req, res) => {
    try {
        const demande = await Demande.findByPk(req.params.id, {
            // Spécification explicite des attributs pour la récupération d'une seule demande.
            include: [{ 
                model: DemandeDetail, 
                as: 'details',
                attributes: [
                    'id',
                    'demande_id',
                    'nature',
                    'libelle',
                    'beneficiaire',
                    'amount',
                    'nif_exists',
                    'numero_compte',
                    'budget_id',
                    'status_detail'
                ]
            }]
        });
        if (!demande) return res.status(404).json({ message: 'Demande non trouvée' });
        res.json(demande);
    } catch (err) {
        console.error("Erreur findOne demande:", err);
        res.status(500).json({ message: 'Erreur récupération demande', error: err.message });
    }
};

/**
 * Met à jour une demande par son ID.
 */
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await Demande.update(req.body, { where: { id } });
        if (updated) {
            res.json({ message: 'Demande mise à jour' });
        } else {
            res.status(404).json({ message: 'Demande non trouvée' });
        }
    } catch (err) {
        console.error("Erreur update demande:", err);
        res.status(500).json({ message: 'Erreur mise à jour', error: err.message });
    }
};

/**
 * Met à jour le statut d'une demande.
 */
exports.updateDemandeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const [updated] = await Demande.update({ status }, { where: { id } });
        if (updated) {
            res.json({ message: 'Statut mis à jour' });
        } else {
            res.status(404).json({ message: 'Demande non trouvée' });
        }
    } catch (err) {
        console.error("Erreur updateDemandeStatus:", err);
        res.status(500).json({ message: 'Erreur mise à jour du statut', error: err.message });
    }
};

/**
 * Récupère des statistiques sur les demandes par statut.
 */
exports.getDemandeStats = async (req, res) => {
    try {
        const stats = await Demande.findAll({
            attributes: ['status', [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'total']],
            group: ['status']
        });
        res.json(stats);
    } catch (err) {
        console.error("Erreur getDemandeStats:", err);
        res.status(500).json({ message: 'Erreur récupération stats', error: err.message });
    }
};

// Fonctions de suppression...
exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        const deleted = await Demande.destroy({ where: { id } });
        if (deleted) {
            res.json({ message: 'Demande supprimée' });
        } else {
            res.status(404).json({ message: 'Demande non trouvée' });
        }
    } catch (err) {
        console.error("Erreur delete demande:", err);
        res.status(500).json({ message: 'Erreur suppression', error: err.message });
    }
};

exports.deleteAll = async (req, res) => {
    try {
        const nbDeleted = await Demande.destroy({ where: {}, truncate: false });
        res.json({ message: `${nbDeleted} demandes supprimées.` });
    } catch (err) {
        console.error("Erreur deleteAll demandes:", err);
        res.status(500).json({ message: 'Erreur suppression toutes demandes', error: err.message });
    }
};
