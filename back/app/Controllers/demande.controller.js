// Fichier: demande.controller.js

const db = require('../Models');
const { Op } = require("sequelize");

// --- Création d'une demande ─────────────────────────────────────────────
// --- Création d'une demande (RH-only validateurs) ─────────────────────────────
// --- Création d'une demande ─────────────────────────────────────────────
exports.create = async (req, res) => {
    const { journal_id, date, details, type, expected_justification_date, pj_status, resp_pj_id, description, montant_total } = req.body;
    const userId = req.userId;

    // Vérification des données requises
    if (!userId || !journal_id || !date || !details || !Array.isArray(details) || details.length === 0) {
        return res.status(400).send({ message: "Le contenu de la demande et ses détails ne peuvent pas être vides." });
    }

    // Calcul du montant total
    const totalCalculated = details.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    if (montant_total && parseFloat(montant_total) !== totalCalculated) {
        return res.status(400).send({ message: "Le montant total ne correspond pas à la somme des détails" });
    }
    const finalMontantTotal = montant_total || totalCalculated;

    let transaction;
    try {
        transaction = await db.sequelize.transaction();

        // Récupérer tous les validateurs du journal
        let validateursDuJournal = await db.journalValider.findAll({
            where: { journal_id },
            include: [{ model: db.user, as: 'user', attributes: ['id', 'role'] }],
            order: [['ordre', 'ASC']],
            transaction
        });

        if (!validateursDuJournal || validateursDuJournal.length === 0) {
            await transaction.rollback();
            return res.status(404).send({ message: "Aucun validateur trouvé pour ce journal." });
        }

        // Filtrer uniquement les utilisateurs RH et exclure le demandeur
        validateursDuJournal = validateursDuJournal.filter(v => v.user.role === 'rh' && v.user.id !== userId);

        if (validateursDuJournal.length === 0) {
            await transaction.rollback();
            return res.status(400).send({ message: "Aucun validateur RH disponible pour ce journal." });
        }

        // Créer la nouvelle demande
        const nouvelleDemande = await db.demande.create({
            userId,
            type,
            journal_id,
            date,
            expected_justification_date,
            pj_status,
            resp_pj_id,
            description,
            status: 'en attente',
            montant_total: finalMontantTotal,
        }, { transaction });

        // Créer les détails de la demande
        const detailsAvecDemandeId = details.map(d => ({ ...d, demande_id: nouvelleDemande.id }));
        await db.demande_detail.bulkCreate(detailsAvecDemandeId, { transaction });

        // Créer les validations uniquement pour les RH
        const firstOrder = validateursDuJournal[0].ordre;
        const validationsACreer = validateursDuJournal.map(v => ({
            demande_id: nouvelleDemande.id,
            user_id: v.user.id,
            ordre: v.ordre,
            statut: (v.ordre === firstOrder) ? 'en attente' : 'initial'
        }));
        await db.demande_validation.bulkCreate(validationsACreer, { transaction });

        await transaction.commit();

        // Retourner la demande complète avec détails et validations
        const demandeComplete = await db.demande.findByPk(nouvelleDemande.id, {
            include: [
                { model: db.demande_detail, as: 'details' },
                {
                    model: db.demande_validation,
                    as: 'validations',
                    include: [{ model: db.user, as: 'user', attributes: ['id', 'username', 'role'] }]
                }
            ]
        });

        res.status(201).send(demandeComplete);

    } catch (err) {
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }
        console.error("Erreur lors de la création de la demande :", err);
        res.status(500).send({ message: err.message || "Erreur lors de la création de la demande." });
    }
};


// --- Récupération d'une demande par ID ────────────────────────────────
exports.findOne = async (req, res) => {
    const id = req.params.id;
    try {
        const demande = await db.demande.findByPk(id, {
            include: [
                { 
                    model: db.user, 
                    attributes: ['username'], 
                    as: 'user' 
                },
                {
                    model: db.journal,
                    as: 'journal',
                    include: [{
                        model: db.journalValider,
                        as: 'validationsConfig',
                        include: [{ model: db.user, as: 'user' }]
                    }]
                },
                { 
                    model: db.demande_detail, 
                    as: 'details' 
                }
            ]
        });
        if (!demande) return res.status(404).send({ message: `Demande ${id} introuvable.` });
        res.send(demande);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Erreur lors de la récupération de la demande." });
    }
};
// Récupérer toutes les demandes de l'utilisateur connecté
exports.findAllUserDemandes = async (req, res) => {
  try {
    const userId = req.userId; // récupéré depuis le middleware d’authentification
    if (!userId) return res.status(401).json({ message: "Utilisateur non authentifié." });

    const demandes = await db.demande.findAll({
      where: { userId }, // filtre par utilisateur
      include: [
        { model: db.user, attributes: ['id', 'username'], as: 'user' },
        { model: db.demande_detail, as: 'details' },
        {
          model: db.journal,
          as: 'journal',
          include: [
            { model: db.journalValider, as: 'validationsConfig', include: [{ model: db.user, as: 'user' }] }
          ]
        }
      ],
      order: [['date', 'DESC']]
    });

    res.status(200).json(demandes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la récupération des demandes", error: err.message });
  }
};


// --- Mise à jour d'une demande ─────────────────────────────────────────
exports.update = async (req, res) => {
    const id = req.params.id;
    try {
        const [num] = await db.demande.update(req.body, { where: { id } });
        if (num === 1) res.send({ message: "Demande mise à jour avec succès." });
        else res.send({ message: `Impossible de mettre à jour la demande ${id}.` });
    } catch (err) {
        res.status(500).send({ message: `Erreur lors de la mise à jour de la demande ${id}` });
    }
};

// --- Suppression d'une demande ─────────────────────────────────────────
exports.delete = async (req, res) => {
    const id = req.params.id;
    try {
        const num = await db.demande.destroy({ where: { id } });
        if (num === 1) res.send({ message: "Demande supprimée avec succès." });
        else res.send({ message: `Demande ${id} introuvable.` });
    } catch (err) {
        res.status(500).send({ message: `Erreur lors de la suppression de la demande ${id}` });
    }
};

// --- Validation d'une demande (RH-only) ────────────────────────────────
exports.validerDemande = async (req, res) => {
    const demandeId = Number(req.params.id);
    const userId = Number(req.userId);
    const { commentaire, signatureBase64 } = req.body;

    let transaction;
    try {
        transaction = await db.sequelize.transaction();

        // Vérifier que l'utilisateur est RH
        const currentUser = await db.user.findByPk(userId, { transaction });
        if (!currentUser || currentUser.role !== 'rh') {
            await transaction.rollback();
            return res.status(403).send({ message: "Seuls les utilisateurs RH peuvent valider cette demande." });
        }

        // Récupérer la demande avec ses validations
        const demande = await db.demande.findByPk(demandeId, {
            include: [
                {
                    model: db.demande_validation,
                    as: 'validations',
                    include: [{ model: db.user, as: 'user' }]
                }
            ],
            transaction
        });

        if (!demande) {
            await transaction.rollback();
            return res.status(404).send({ message: "Demande introuvable." });
        }

        // --- LOGIQUE TOUR PAR TOUR STRICTE ---
        const minOrdreEnAttente = Math.min(
            ...demande.validations
                .filter(v => v.statut === 'en attente')
                .map(v => v.ordre)
        );

        const validationActuelle = demande.validations.find(
            v => Number(v.user_id) === userId && v.statut === 'en attente' && v.ordre === minOrdreEnAttente
        );

        if (!validationActuelle) {
            await transaction.rollback();
            return res.status(403).send({ message: "Ce n'est pas votre tour pour valider cette demande RH." });
        }

        // Mise à jour de la validation
        await db.demande_validation.update(
            {
                statut: 'validé',
                commentaire,
                signature: signatureBase64,
                date_validation: new Date()
            },
            { where: { id: validationActuelle.id }, transaction }
        );

        // Vérifier si toutes les validations du même ordre sont terminées
        const validationsSameOrder = await db.demande_validation.findAll({
            where: { demande_id: demandeId, ordre: validationActuelle.ordre },
            transaction
        });

        const allSameOrderCompleted = validationsSameOrder.every(v =>
            v.statut === 'validé' || v.statut === 'rejeté'
        );

        if (!allSameOrderCompleted) {
            await transaction.commit();
            return res.status(200).send({
                message: "Validation RH enregistrée. En attente des autres validateurs du même ordre."
            });
        }

        // Passer à l'ordre suivant
        const nextOrder = validationActuelle.ordre + 1;
        const nextValidations = await db.demande_validation.findAll({
            where: { demande_id: demandeId, ordre: nextOrder, statut: 'initial' },
            transaction
        });

        if (nextValidations.length > 0) {
            await db.demande_validation.update(
                { statut: 'en attente' },
                { where: { demande_id: demandeId, ordre: nextOrder }, transaction }
            );
        } else {
            // Finaliser la demande
            await db.demande.update(
                { status: 'approuvée' },
                { where: { id: demandeId }, transaction }
            );
        }

        await transaction.commit();
        res.status(200).send({ message: "Demande validée avec succès par RH." });

    } catch (err) {
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }
        console.error(err);
        res.status(500).send({ message: "Erreur interne lors de la validation RH." });
    }
};



// --- Refus d'une demande ───────────────────────────────────────────────
exports.refuserDemande = async (req, res) => {
    const demandeId = Number(req.params.id);
    const userId = req.userId;
    const { commentaire } = req.body;

    let transaction;
    try {
        transaction = await db.sequelize.transaction();

        // Récupérer la demande
        const demande = await db.demande.findByPk(demandeId, {
            include: [{ model: db.demande_validation, as: 'validations' }],
            transaction
        });

        if (!demande) {
            await transaction.rollback();
            return res.status(404).send({ message: "Demande introuvable." });
        }

        // Trouver la validation actuelle
        const validationActuelle = demande.validations.find(
            v => Number(v.user_id) === userId && v.statut === 'en attente'
        );

        if (!validationActuelle) {
            await transaction.rollback();
            return res.status(403).send({ message: "Vous n'êtes pas le validateur actuel de cette demande." });
        }

        // Mise à jour du statut
        await db.demande_validation.update(
            { 
                statut: 'rejeté', 
                commentaire, 
                date_validation: new Date() 
            },
            { where: { id: validationActuelle.id }, transaction }
        );

        // Annuler les validations suivantes
        await db.demande_validation.update(
            { statut: 'annulé' },
            { 
                where: { 
                    demande_id: demandeId,
                    ordre: { [Op.gt]: validationActuelle.ordre } 
                },
                transaction
            }
        );

        // Mettre à jour le statut de la demande
        await db.demande.update(
            { status: 'rejetée' },
            { where: { id: demandeId }, transaction }
        );

        await transaction.commit();
        res.status(200).send({ message: "Demande rejetée avec succès." });

    } catch (err) {
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }
        console.error(err);
        res.status(500).send({ message: "Erreur interne lors du refus de la demande." });
    }
};
exports.getDemandesAValider = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).send({ message: "Utilisateur non authentifié." });

        // Récupérer toutes les demandes où l'utilisateur a une validation en attente
        const demandes = await db.demande.findAll({
            include: [
                { model: db.demande_detail, as: 'details' },
                {
                    model: db.demande_validation,
                    as: 'validations',
                    include: [{ model: db.user, as: 'user', attributes: ['id', 'role'] }]
                },
                {
                    model: db.journal,
                    as: 'journal',
                    include: [
                        { model: db.journalValider, as: 'validationsConfig', include: [{ model: db.user, as: 'user' }] }
                    ]
                }
            ],
            order: [['date', 'DESC']]
        });

        // Filtrer les demandes où c'est vraiment le tour de l'utilisateur
        const demandesFiltrees = demandes.filter(d => {
            // Récupérer toutes les validations en attente RH
            const validationsRH = d.validations
                .filter(v => v.user.role === 'rh' && v.statut === 'en attente');

            if (validationsRH.length === 0) return false;

            // Trouver l'ordre minimal en attente
            const ordreMin = Math.min(...validationsRH.map(v => v.ordre));

            // Vérifier si l'utilisateur connecté est dans cet ordre
            return validationsRH.some(v => v.user.id === userId && v.ordre === ordreMin);
        });

        res.json(demandesFiltrees);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err.message });
    }
};

// --- Demandes en attente chez un autre validateur ────────────
exports.getDemandesEnAttenteAutres = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).send({ message: "Utilisateur non authentifié." });

        // ─── CORRECTION : UTILISER UNE SOUS-REQUÊTE PLUS PRÉCISE ───────────────
        const demandes = await db.demande.findAll({
            where: {
                status: 'en attente',
                id: {
                    [Op.notIn]: db.sequelize.literal(`(
                        SELECT demande_id 
                        FROM demande_validations 
                        WHERE user_id = ${userId} 
                        AND statut = 'en attente'
                    )`)
                }
            },
            include: [
                {
                    model: db.demande_validation,
                    as: 'validations',
                    where: { statut: 'en attente' },
                    required: true,
                },
                { 
                    model: db.demande_detail, 
                    as: 'details' 
                },
                {
                    model: db.journal,
                    as: 'journal',
                    include: [
                        { 
                            model: db.journalValider, 
                            as: 'validationsConfig', 
                            include: [{ model: db.user, as: 'user' }] 
                        }
                    ]
                }
            ],
            order: [['date', 'DESC']]
        });
        res.json(demandes);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err.message });
    }
};
// --- Demandes déjà finalisées ────────────────────────────────
exports.getDemandesFinalisees = async (req, res) => {
    try {
        const demandes = await db.demande.findAll({
            where: {
                status: { [Op.in]: ['approuvée', 'rejetée'] }
            },
            include: [
                { 
                    model: db.demande_detail, 
                    as: 'details' 
                },
                {
                    model: db.journal,
                    as: 'journal',
                    include: [
                        { 
                            model: db.journalValider, 
                            as: 'validationsConfig', 
                            include: [{ model: db.user, as: 'user' }] 
                        }
                    ]
                }
            ],
            order: [['date', 'DESC']]
        });

        res.json(demandes);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err.message });
    }
};

// --- Statistiques simples ─────────────────────────────────────────────
exports.getDemandeStats = async (req, res) => {
    try {
        const total = await db.demande.count();
        const enAttente = await db.demande.count({ where: { status: 'en attente' } });
        const finalisees = await db.demande.count({ where: { status: { [Op.in]: ['approuvée', 'rejetée'] } } });
        res.json({ total, enAttente, finalisees });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};