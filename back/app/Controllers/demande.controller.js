const db = require('../Models');
const { Op } = require("sequelize");
const { SEUIL_VALIDATION_DAF } = require('../Config/businessRules');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Constantes pour éviter les chaînes de caractères littérales
const DEMANDE_STATUS = {
    EN_ATTENTE: 'en attente',
    APPROUVEE: 'approuvée',
    REJETEE: 'rejetée'
};

const VALIDATION_STATUS = {
    EN_ATTENTE: 'en attente',
    VALIDEE: 'validé',
    REJETEE: 'rejeté',
    INITIAL: 'initial',
    ANNULEE: 'annulé'
};

const PJ_STATUS = {
    PAS_ENCORE: 'pas encore',
    OUI: 'oui'
};

const USER_ROLES = {
    DAF: 'daf',
    RH: 'rh'
};

const DEMANDE_TYPE = {
    DED: 'DED',
    RECETTE: 'Recette',
    ERD: 'ERD'
};

// --- Création d'une demande ─────────────────────────────────────────────
exports.create = async (req, res) => {
    const { journal_id, date, details, type, expected_justification_date, pj_status, resp_pj_id, description, montant_total } = req.body;
    const userId = req.userId;

    if (!userId || !journal_id || !date || !details || !Array.isArray(details) || details.length === 0) {
        return res.status(400).send({ message: "Le contenu de la demande et ses détails ne peuvent pas être vides." });
    }

    const finalMontantTotal = parseFloat(montant_total);

    let transaction;
    try {
        transaction = await db.sequelize.transaction();

        // Créer la demande sans toucher au solde
        const nouvelleDemande = await db.demande.create({
            userId,
            type,
            journal_id,
            date,
            expected_justification_date,
            pj_status,
            resp_pj_id,
            description,
            status: DEMANDE_STATUS.EN_ATTENTE,
            montant_total: finalMontantTotal
        }, { transaction });

        // Créer les détails
        const detailsAvecDemandeId = details.map(d => ({ ...d, demande_id: nouvelleDemande.id }));
        await db.demande_detail.bulkCreate(detailsAvecDemandeId, { transaction });

        // Récupérer validateurs et créer validations
        const validateursDuJournal = await db.journalValider.findAll({
            where: { journal_id },
            include: [{ model: db.user, as: 'user', attributes: ['id', 'role'] }],
            order: [['ordre', 'ASC']],
            transaction
        });

        let validateursACreer = validateursDuJournal.filter(v => v.user.id !== userId);

        // Ajouter le DAF si le montant dépasse le seuil
        if (finalMontantTotal > SEUIL_VALIDATION_DAF && !validateursACreer.some(v => v.user.role === USER_ROLES.DAF)) {
            const daf = await db.user.findOne({ where: { role: USER_ROLES.DAF }, transaction });
            if (daf) {
                const maxOrder = validateursACreer.length > 0 ? Math.max(...validateursACreer.map(v => v.ordre)) : 0;
                validateursACreer.push({ user: daf, ordre: maxOrder + 1, isNew: true });
            }
        }

        if (validateursACreer.length === 0) {
            await transaction.rollback();
            return res.status(400).send({ message: "Aucun validateur disponible pour cette demande." });
        }

        validateursACreer.sort((a, b) => a.ordre - b.ordre);
        const firstOrder = validateursACreer[0].ordre;

        const validationsACreer = validateursACreer.map(v => ({
            demande_id: nouvelleDemande.id,
            user_id: v.user.id,
            ordre: v.ordre,
            statut: (v.ordre === firstOrder) ? VALIDATION_STATUS.EN_ATTENTE : VALIDATION_STATUS.INITIAL
        }));

        await db.demande_validation.bulkCreate(validationsACreer, { transaction });

        await transaction.commit();

        const demandeComplete = await db.demande.findByPk(nouvelleDemande.id, {
            include: [
                { model: db.demande_detail, as: 'details' },
                { 
                    model: db.demande_validation, 
                    as: 'validations', 
                    include: [{ 
                        model: db.user, 
                        as: 'user', 
                        attributes: ['id', 'username', 'role'] 
                    }] 
                }
            ]
        });

        res.status(201).send(demandeComplete);

    } catch (err) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error(err);
        res.status(500).send({ message: err.message || "Erreur lors de la création de la demande." });
    }
};

// --- Récupérer une demande par ID ──────────────────────────────────────
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
                    model: db.personne,
                    as: 'responsible_pj'
                },
                {
                    model: db.journal,
                    as: 'journal'
                },
                {
                    model: db.demande_detail,
                    as: 'details',
                    include: [
                        {
                            model: db.budget,
                            as: 'budget',
                            attributes: [
                                'id_budget',
                                'code_budget',
                                'description',
                                'annee_fiscale',
                                'budget_annuel',
                                'budget_trimestre_1',
                                'budget_trimestre_2',
                                'budget_trimestre_3',
                                'budget_trimestre_4'
                            ]
                        }
                    ]
                },
                {
                    model: db.demande_validation,
                    as: 'validations',
                    attributes: [
                        'id',
                        'statut',
                        'ordre',
                        'date_validation',
                        'commentaire',
                        'signature_validation_url',
                        'user_id'
                    ],
                    include: [{
                        model: db.user,
                        as: 'user',
                        attributes: ['id', 'username', 'role', 'signature_image_url']
                    }]
                }
            ]
        });

        if (!demande) {
            return res.status(404).send({ message: `Demande ${id} introuvable.` });
        }

        // Logique pour choisir la bonne signature
        const demandeAvecSignaturesStatiques = demande.toJSON();
        demandeAvecSignaturesStatiques.validations = demandeAvecSignaturesStatiques.validations.map(validation => {
            const signatureFinale = validation.signature_validation_url || (validation.user ? validation.user.signature_image_url : null);
            return {
                ...validation,
                signatureFinale: signatureFinale
            };
        });

        res.send(demandeAvecSignaturesStatiques);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Erreur lors de la récupération de la demande." });
    }
};

// --- Récupérer toutes les demandes d'un utilisateur ────────────────────
exports.findAllUserDemandes = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ message: "Utilisateur non authentifié." });

        const demandes = await db.demande.findAll({
            where: { userId },
            include: [
                { model: db.user, attributes: ['id', 'username'], as: 'user' },
                { model: db.demande_detail, as: 'details' },
                { 
                    model: db.personne, 
                    as: 'responsible_pj', 
                    attributes: ['nom', 'prenom'] 
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

        res.status(200).json(demandes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la récupération des demandes", error: err.message });
    }
};

// --- Récupérer les demandes DAF à valider ──────────────────────────────
exports.getDemandesDAFAValider = async (req, res) => {
    const userId = Number(req.userId);
    try {
        // Vérifier si l'utilisateur est bien le DAF
        const dafUser = await db.user.findByPk(userId);
        if (!dafUser || dafUser.role !== 'daf') {
            return res.status(403).send({ message: "Seul le DAF peut accéder à cette ressource." });
        }

        // Récupérer les demandes avec montant supérieur au seuil DAF
        const demandes = await db.demande.findAll({
            where: {
                montant_total: {
                    [Op.gt]: SEUIL_VALIDATION_DAF 
                },
                status: DEMANDE_STATUS.EN_ATTENTE
            },
            include: [
                {
                    model: db.demande_validation,
                    as: 'validations',
                    where: {
                        statut: VALIDATION_STATUS.EN_ATTENTE
                    },
                    required: true,
                    include: [{ model: db.user, as: 'user', attributes: ['id', 'username', 'role'] }]
                },
                { model: db.demande_detail, as: 'details' },
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

        // Filtrer les demandes pour s'assurer que l'utilisateur est le prochain validateur
        const demandesFiltrees = demandes.filter(demande => {
            const validationsEnAttente = demande.validations.filter(v => v.statut === VALIDATION_STATUS.EN_ATTENTE);
            if (validationsEnAttente.length === 0) {
                return false;
            }

            // Trier les validations par ordre pour trouver la prochaine
            validationsEnAttente.sort((a, b) => a.ordre - b.ordre);
            const prochaineValidation = validationsEnAttente[0];

            // S'assurer que le prochain validateur est bien l'utilisateur DAF
            return prochaineValidation.user_id === userId;
        }).map(demande => {
            return {
                ...demande.toJSON(),
                estTourUtilisateur: true
            };
        });

        res.json(demandesFiltrees);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err.message || "Erreur interne lors de la récupération des demandes DAF." });
    }
};

// --- Validation d'une demande (RH et DAF) ──────────────────────────────
exports.validerDemande = async (req, res) => {
    const demandeId = Number(req.params.id);
    const userId = Number(req.userId);
    const { commentaire, signatureBase64 } = req.body;

    let transaction;
    try {
        transaction = await db.sequelize.transaction();

        const currentUser = await db.user.findByPk(userId, { transaction });
        if (!currentUser || (currentUser.role !== 'rh' && currentUser.role !== 'daf')) {
            await transaction.rollback();
            return res.status(403).send({ message: "Seuls les utilisateurs RH et DAF peuvent valider cette demande." });
        }

        const validationActuelle = await db.demande_validation.findOne({
            where: {
                demande_id: demandeId,
                user_id: userId,
                statut: 'en attente'
            },
            transaction,
            order: [['ordre', 'ASC']]
        });

        if (!validationActuelle) {
            await transaction.rollback();
            return res.status(403).send({ message: "Ce n'est pas votre tour ou la demande est déjà validée/rejetée." });
        }

        const minOrdreEnAttente = await db.demande_validation.min('ordre', {
            where: {
                demande_id: demandeId,
                statut: 'en attente'
            },
            transaction
        });

        if (validationActuelle.ordre !== minOrdreEnAttente) {
            await transaction.rollback();
            return res.status(403).send({ message: "Ce n'est pas votre tour pour valider cette demande." });
        }

        let signatureUrl = null;
        if (signatureBase64) {
            const uploadDir = path.join(__dirname, '..', 'public', 'signatures');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filename = `signature-${demandeId}-${userId}-${uuidv4()}.png`;
            const filePath = path.join(uploadDir, filename);

            const base64Data = signatureBase64.replace(/^data:image\/png;base64,/, "");
            fs.writeFileSync(filePath, base64Data, 'base64');
            signatureUrl = `/signatures/${filename}`;
        }
        
        await validationActuelle.update(
            { 
                statut: 'validé', 
                commentaire, 
                signature_validation_url: signatureUrl,
                date_validation: new Date() 
            },
            { transaction }
        );

        const validationsDuMemeOrdre = await db.demande_validation.count({
            where: {
                demande_id: demandeId,
                ordre: validationActuelle.ordre,
                statut: 'en attente'
            },
            transaction
        });

        if (validationsDuMemeOrdre > 0) {
            await transaction.commit();
            return res.status(200).send({ message: "Validation enregistrée. En attente des autres validateurs du même ordre." });
        }

        const nextOrder = validationActuelle.ordre + 1;
        const nextValidations = await db.demande_validation.count({
            where: {
                demande_id: demandeId,
                ordre: nextOrder
            },
            transaction
        });

        if (nextValidations > 0) {
            await db.demande_validation.update(
                { statut: 'en attente' },
                { where: { demande_id: demandeId, ordre: nextOrder }, transaction }
            );
        } else {
            const demande = await db.demande.findByPk(demandeId, { transaction });
            if (!demande) {
                await transaction.rollback();
                return res.status(404).send({ message: "Demande introuvable lors de la finalisation." });
            }
            
            // LE TRIGGER S'OCCUPE MAINTENANT DE METTRE À JOUR LE SOLDE
            await demande.update({ 
                status: 'approuvée',
                date_approuvee: new Date()
            }, { transaction });
        }

        await transaction.commit();
        res.status(200).send({ message: "Demande validée avec succès." });

    } catch (err) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error(err);
        res.status(500).send({ message: "Erreur interne lors de la validation." });
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
            v => Number(v.user_id) === userId && v.statut === VALIDATION_STATUS.EN_ATTENTE
        );

        if (!validationActuelle) {
            await transaction.rollback();
            return res.status(403).send({ message: "Vous n'êtes pas le validateur actuel de cette demande." });
        }

        // Mise à jour du statut
        await db.demande_validation.update(
            {
                statut: VALIDATION_STATUS.REJETEE,
                commentaire,
                date_validation: new Date()
            },
            { where: { id: validationActuelle.id }, transaction }
        );

        // Annuler les validations suivantes
        await db.demande_validation.update(
            { statut: VALIDATION_STATUS.ANNULEE },
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
            { status: DEMANDE_STATUS.REJETEE },
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

// --- Demandes à valider par l'utilisateur connecté (RH/DAF) ────────────
exports.getDemandesAValider = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).send({ message: "Utilisateur non authentifié." });
        }

        const demandes = await db.demande.findAll({
            where: {
                status: DEMANDE_STATUS.EN_ATTENTE
            },
            include: [
                { model: db.demande_detail, as: 'details' },
                { model: db.personne, as: 'responsible_pj' },
                {
                    model: db.demande_validation,
                    as: 'validations',
                    include: [{ model: db.user, as: 'user', attributes: ['id', 'username', 'role'] }]
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

        const demandesFiltrees = demandes.filter(d => {
            const validationsActives = d.validations.filter(v => v.statut === VALIDATION_STATUS.EN_ATTENTE);
            if (validationsActives.length === 0) return false;

            const minOrdre = Math.min(...validationsActives.map(v => v.ordre));

            // Vérifier si l'utilisateur est le validateur avec l'ordre le plus bas
            return validationsActives.some(v => v.user.id === userId && v.ordre === minOrdre);
        });

        res.json(demandesFiltrees);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err.message });
    }
};

// --- Demandes en attente chez un autre validateur ──────────────────────
exports.getDemandesEnAttenteAutres = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).send({ message: "Utilisateur non authentifié." });

        // Récupérer les ID des demandes pour lesquelles l'utilisateur est un validateur en attente
        const demandeIdsToExclude = await db.demande_validation.findAll({
            attributes: ['demande_id'],
            where: {
                user_id: userId,
                statut: VALIDATION_STATUS.EN_ATTENTE
            },
            raw: true
        });

        const excludedIds = demandeIdsToExclude.map(validation => validation.demande_id);
        
        // Récupérer les demandes en attente qui ne sont pas dans la liste des ID exclus
        const demandes = await db.demande.findAll({
            where: {
                status: DEMANDE_STATUS.EN_ATTENTE,
                id: {
                    [Op.notIn]: excludedIds
                }
            },
            include: [
                { model: db.personne, as: 'responsible_pj' },
                {
                    model: db.demande_validation,
                    as: 'validations',
                    include: [{ model: db.user, as: 'user', attributes: ['id', 'username', 'role'] }],
                    where: { statut: VALIDATION_STATUS.EN_ATTENTE },
                    required: true
                },
                { model: db.demande_detail, as: 'details' },
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

// --- Demandes déjà finalisées ──────────────────────────────────────────
exports.getDemandesFinalisees = async (req, res) => {
    try {
        const demandes = await db.demande.findAll({
            where: {
                status: { [Op.in]: [DEMANDE_STATUS.APPROUVEE, DEMANDE_STATUS.REJETEE] }
            },
            include: [
                { model: db.personne, as: 'responsible_pj' },
                { model: db.demande_detail, as: 'details' },
                {
                    model: db.demande_validation,
                    as: 'validations',
                    include: [{ model: db.user, as: 'user', attributes: ['id', 'username', 'role'] }]
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

// --- Récupérer les demandes PJ non fournies ────────────────────────────
exports.getDemandesPJNonFournies = async (req, res) => {
    try {
        const demandes = await db.demande.findAll({
            where: {
                pj_status: PJ_STATUS.PAS_ENCORE,
                status: DEMANDE_STATUS.APPROUVEE,
                type: DEMANDE_TYPE.DED
            },
            include: [
                { model: db.user, attributes: ['id', 'username'], as: 'user' },
                { model: db.demande_detail, as: 'details' },
                { model: db.personne, as: 'responsible_pj' },
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

        res.status(200).json(demandes);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Erreur lors de la récupération des demandes PJ non fournies." });
    }
};

// --- Mettre à jour le pj_status d'un DED ───────────────────────────────
exports.updatePjStatus = async (req, res) => {
    const dedId = req.params.id;
    const { pj_status } = req.body;

    try {
        const ded = await db.demande.findByPk(dedId);
        if (!ded) return res.status(404).json({ message: 'DED non trouvé' });

        ded.pj_status = pj_status;
        await ded.save();

        res.json({ message: `PJ status du DED ${dedId} mis à jour en '${pj_status}'` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du DED', error: err.message });
    }
};

// --- Mettre à jour une demande ─────────────────────────────────────────
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

// --- Supprimer une demande ─────────────────────────────────────────────
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

// --- Statistiques des demandes ─────────────────────────────────────────
exports.getDemandeStats = async (req, res) => {
    try {
        const userId = req.userId;

        const stats = await db.demande.findAll({
            attributes: [
                [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'total'],
                [db.Sequelize.fn('SUM', db.Sequelize.literal(`CASE WHEN status = '${DEMANDE_STATUS.EN_ATTENTE}' THEN 1 ELSE 0 END`)), 'enAttente'],
                [db.Sequelize.fn('SUM', db.Sequelize.literal(`CASE WHEN status = '${DEMANDE_STATUS.APPROUVEE}' THEN 1 ELSE 0 END`)), 'approuvees'],
                [db.Sequelize.fn('SUM', db.Sequelize.literal(`CASE WHEN status = '${DEMANDE_STATUS.REJETEE}' THEN 1 ELSE 0 END`)), 'rejetees']
            ],
            where: { userId }
        });

        res.json(stats[0] || { total: 0, enAttente: 0, approuvees: 0, rejetees: 0 });

    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err.message });
    }
};

// --- Rapport des demandes approuvées ───────────────────────────────────
exports.getRapportDemandesApprouvees = async (req, res) => {
    const journalId = req.params.journalId;
    const { startDate, endDate } = req.query;

    try {
        let whereCondition = {
            status: DEMANDE_STATUS.APPROUVEE,
            journal_id: journalId
        };

        // Ajouter le filtrage par date si les paramètres sont fournis
        if (startDate && endDate) {
            whereCondition.date_approuvee = {
                [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59.999')]
            };
        }

        const demandes = await db.demande.findAll({
            where: whereCondition,
            attributes: [
                'id',
                'type',
                'date_approuvee',
                ['numero_approuve_journal', 'numero_journal_approuve'],
                ['description', 'motif'],
                'montant_total',
                'soldeProgressif'
            ],
            order: [
                ['date_approuvee', 'ASC'],
                ['numero_approuve_journal', 'ASC']
            ]
        });

        // Formater la date pour l'affichage
        const demandesFormatees = demandes.map(d => {
            const obj = d.toJSON();
            obj.date_approuve = obj.date_approuvee;
            delete obj.date_approuvee;
            return obj;
        });

        res.status(200).json(demandesFormatees);

    } catch (err) {
        console.error('Erreur détaillée:', err);
        res.status(500).json({ 
            message: 'Erreur lors de la récupération du rapport', 
            error: err.message 
        });
    }
};

// --- Récupérer les demandes par nom de projet ──────────────────────────
exports.getDemandesByProjectName = async (req, res) => {
  const nomProjet = req.params.nomProjet;

  try {
    const demandes = await db.demande.findAll({
      include: [
        {
          model: db.journal,
          as: 'journal',
          where: { nom_projet: nomProjet }
        },
        {
          model: db.demande_detail,
          as: 'details',
          include: [
            {
              model: db.budget,
              as: 'budget'
            }
          ]
        },
        {
          model: db.user,
          as: 'user',
          attributes: ['id', 'username']
        }
      ],
      order: [['date_approuvee', 'DESC']]
    });

    if (!demandes || demandes.length === 0) {
      return res.status(200).send([]);
    }

    res.status(200).send(demandes);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || "Erreur serveur" });
  }
};

// --- Informations budget par code ──────────────────────────────────────
exports.getBudgetInfoByCode = async (req, res) => {
  const codeBudget = req.params.codeBudget;
  try {
    const budgetInfo = await db.budget.findAll({
      attributes: [
        'code_budget',
        'budget_annuel',
        'reste_budget',
        'budget_trimestre_1',
        'budget_trimestre_2',
        'budget_trimestre_3',
        'budget_trimestre_4',
        'reste_trimestre_1',
        'reste_trimestre_2',
        'reste_trimestre_3',
        'reste_trimestre_4'
      ],
      where: { code_budget: codeBudget },
      limit: 25,
      include: [
        {
          model: db.journal,
          as: 'journals',
          attributes: ['nom_projet'],
          required: true,
          through: {
            attributes: []
          }
        }
      ]
    });
    if (!budgetInfo || budgetInfo.length === 0) {
      return res.status(404).send({ message: "Aucune information de budget trouvée pour ce code." });
    }
    const formattedResults = budgetInfo.flatMap(info =>
      info.get('journals').map(journal => ({
        code_budget: info.get('code_budget'),
        nom_projet: journal.get('nom_projet'),
        budget_annuel: info.get('budget_annuel'),
        reste_budget: info.get('reste_budget'),
        budget_trimestre_1: info.get('budget_trimestre_1'),
        budget_trimestre_2: info.get('budget_trimestre_2'),
        budget_trimestre_3: info.get('budget_trimestre_3'),
        budget_trimestre_4: info.get('budget_trimestre_4'),
        reste_trimestre_1: info.get('reste_trimestre_1'),
        reste_trimestre_2: info.get('reste_trimestre_2'),
        reste_trimestre_3: info.get('reste_trimestre_3'),
        reste_trimestre_4: info.get('reste_trimestre_4'),
      }))
    );
    res.status(200).send(formattedResults);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || "Erreur serveur" });
  }
};

// --- Projets avec budgets ──────────────────────────────────────────────
exports.getProjetsWithBudgets = async (req, res) => {
  try {
    const projetsBudgets = await db.journal.findAll({
      attributes: ['id_journal', 'nom_projet', 'nom_journal'],
      include: [
        {
          model: db.budget,
          as: 'budgets',
          attributes: [
            'id_budget',
            'code_budget',
            'description',
            'budget_annuel',
            'reste_budget',
            'budget_trimestre_1',
            'budget_trimestre_2',
            'budget_trimestre_3',
            'budget_trimestre_4',
            'reste_trimestre_1',
            'reste_trimestre_2',
            'reste_trimestre_3',
            'reste_trimestre_4'
          ],
          through: { attributes: [] }
        }
      ],
      order: [['nom_projet', 'ASC'], ['id_journal', 'ASC']]
    });
    res.status(200).send(projetsBudgets);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || "Erreur serveur" });
  }
};

// --- Mettre à jour le statut d'une demande ─────────────────────────────
exports.updateStatus = async (req, res) => {
  const id = req.params.id;
  const { status, comments } = req.body;

  try {
    const demande = await db.demande.findByPk(id);
    if (!demande) return res.status(404).json({ message: "Demande non trouvée" });

    demande.status = status;
    demande.comments = comments || demande.comments;

    await demande.save();
    res.json(demande);
  } catch (err) {
    console.error("Erreur updateStatus:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// --- Rapport par projet et budget ──────────────────────────────────────
exports.getRapportByProjetAndBudget = async (req, res) => {
    try {
        const { nom_projet, code_budget } = req.query;

        if (!nom_projet || !code_budget) {
            return res.status(400).send({ message: "Les paramètres 'nom_projet' et 'code_budget' sont requis." });
        }

        const demandes = await db.demande.findAll({
            include: [
                {
                    model: db.demande_detail,
                    as: 'details',
                    required: true,
                    include: [
                        {
                            model: db.budget,
                            as: 'budget',
                            required: true
                        }
                    ]
                },
                {
                    model: db.journal,
                    as: 'journal',
                    attributes: ['id_journal', 'nom_journal'],
                    required: true
                },
                {
                    model: db.user,
                    as: 'user',
                    attributes: ['id', 'username', 'email']
                }
            ],
            where: {
                '$journal.nom_projet$': {
                    [Op.like]: `%${nom_projet}%`
                },
                '$details.budget.code_budget$': code_budget
            },
            order: [['date', 'DESC']]
        });

        res.status(200).json(demandes);
    } catch (err) {
        console.error("Erreur lors de la récupération du rapport:", err);
        res.status(500).send({ message: "Erreur lors de la récupération du rapport par projet et budget.", error: err.message });
    }
};
// --- Validation du tour actuel ────────────────────────────────────────
exports.validateTour = async (req, res) => {
    const demandeId = Number(req.params.id);
    const userId = Number(req.userId);
    const { commentaire } = req.body;

    console.log(`🔄 Validation du tour pour demande ${demandeId} par utilisateur ${userId}`);

    let transaction;
    try {
        transaction = await db.sequelize.transaction();

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
            return res.status(404).json({ message: "Demande non trouvée." });
        }

        if (demande.status !== 'en attente') {
            await transaction.rollback();
            return res.status(400).json({ message: "La demande n'est pas en attente de validation." });
        }

        const validationEnAttente = await db.demande_validation.findOne({
            where: {
                demande_id: demandeId,
                user_id: userId,
                statut: 'en attente'
            },
            transaction,
            order: [['ordre', 'ASC']]
        });

        if (!validationEnAttente) {
            await transaction.rollback();
            return res.status(403).json({ 
                message: "Aucune validation en attente trouvée pour cet utilisateur ou ce n'est pas votre tour." 
            });
        }

        const minOrdreEnAttente = await db.demande_validation.min('ordre', {
            where: {
                demande_id: demandeId,
                statut: 'en attente'
            },
            transaction
        });

        if (validationEnAttente.ordre !== minOrdreEnAttente) {
            await transaction.rollback();
            return res.status(403).json({ 
                message: "Ce n'est pas votre tour de validation. Veuillez attendre votre tour." 
            });
        }

        // Mettre à jour la validation actuelle
        await validationEnAttente.update(
            { 
                statut: 'validé',
                commentaire: commentaire || '',
                date_validation: new Date()
            },
            { transaction }
        );

        console.log(`✅ Tour ${validationEnAttente.ordre} validé par l'utilisateur ${userId}`);

        // Vérifier s'il reste des validations en attente pour cet ordre
        const validationsDuMemeOrdreEnAttente = await db.demande_validation.count({
            where: {
                demande_id: demandeId,
                ordre: validationEnAttente.ordre,
                statut: 'en attente'
            },
            transaction
        });

        let message = "Tour validé avec succès";
        let demandeFinalisee = false;

        // Si toutes les validations de cet ordre sont terminées
        if (validationsDuMemeOrdreEnAttente === 0) {
            const nextOrder = validationEnAttente.ordre + 1;
            const validationsOrdreSuivant = await db.demande_validation.count({
                where: {
                    demande_id: demandeId,
                    ordre: nextOrder
                },
                transaction
            });

            if (validationsOrdreSuivant > 0) {
                // Activer les validations de l'ordre suivant
                await db.demande_validation.update(
                    { statut: 'en attente' },
                    { 
                        where: { 
                            demande_id: demandeId, 
                            ordre: nextOrder 
                        }, 
                        transaction 
                    }
                );
                console.log(`➡️ Passage au tour ${nextOrder}`);
                message = `Tour ${validationEnAttente.ordre} validé. Passage au tour ${nextOrder}.`;
            } else {
                // Plus de validations - finaliser la demande
                // LE TRIGGER S'OCCUPE MAINTENANT DE METTRE À JOUR LE SOLDE
                await demande.update(
                    { 
                        status: 'approuvée',
                        date_approuvee: new Date()
                    }, 
                    { transaction }
                );

                demandeFinalisee = true;
                message = "Demande approuvée définitivement après validation de tous les tours";
                console.log(`🎉 Demande ${demandeId} approuvée définitivement`);
            }
        }

        await transaction.commit();

        // Récupérer la demande mise à jour
        const demandeMiseAJour = await db.demande.findByPk(demandeId, {
            include: [
                {
                    model: db.demande_validation,
                    as: 'validations',
                    include: [{ 
                        model: db.user, 
                        as: 'user', 
                        attributes: ['id', 'username', 'role', 'signature_image_url'] 
                    }]
                },
                { model: db.demande_detail, as: 'details' },
                { model: db.journal, as: 'journal' },
                { 
                    model: db.user, 
                    as: 'user', 
                    attributes: ['id', 'username'] 
                }
            ]
        });

        res.status(200).json({
            message,
            demande: demandeMiseAJour,
            tourValide: validationEnAttente.ordre,
            demandeFinalisee
        });

    } catch (error) {
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }
        console.error('❌ Erreur validation tour:', error);
        res.status(500).json({ 
            message: "Erreur interne lors de la validation du tour",
            error: error.message 
        });
    }
};
// --- Rejet du tour actuel ─────────────────────────────────────────────
exports.rejectTour = async (req, res) => {
    const demandeId = Number(req.params.id);
    const userId = Number(req.userId);
    const { raison } = req.body;

    console.log(`🔄 Rejet du tour pour demande ${demandeId} par utilisateur ${userId}`);

    if (!raison || raison.trim() === '') {
        return res.status(400).json({ message: "La raison du rejet est obligatoire." });
    }

    let transaction;
    try {
        transaction = await db.sequelize.transaction();

        // Récupérer la demande
        const demande = await db.demande.findByPk(demandeId, {
            include: [
                {
                    model: db.demande_validation,
                    as: 'validations'
                }
            ],
            transaction
        });

        if (!demande) {
            await transaction.rollback();
            return res.status(404).json({ message: "Demande non trouvée." });
        }

        if (demande.status !== 'en attente') {
            await transaction.rollback();
            return res.status(400).json({ message: "La demande n'est pas en attente de validation." });
        }

        // Trouver la validation en attente pour cet utilisateur
        const validationEnAttente = await db.demande_validation.findOne({
            where: {
                demande_id: demandeId,
                user_id: userId,
                statut: 'en attente'
            },
            transaction,
            order: [['ordre', 'ASC']]
        });

        if (!validationEnAttente) {
            await transaction.rollback();
            return res.status(403).json({ 
                message: "Aucune validation en attente trouvée pour cet utilisateur ou ce n'est pas votre tour." 
            });
        }

        // Vérifier que c'est bien le tour actuel
        const minOrdreEnAttente = await db.demande_validation.min('ordre', {
            where: {
                demande_id: demandeId,
                statut: 'en attente'
            },
            transaction
        });

        if (validationEnAttente.ordre !== minOrdreEnAttente) {
            await transaction.rollback();
            return res.status(403).json({ 
                message: "Ce n'est pas votre tour de validation." 
            });
        }

        // Mettre à jour la validation actuelle avec rejet
        await validationEnAttente.update(
            {
                statut: 'rejeté',
                commentaire: raison,
                date_validation: new Date()
            },
            { transaction }
        );

        console.log(`❌ Tour ${validationEnAttente.ordre} rejeté par l'utilisateur ${userId}`);

        // Annuler toutes les validations suivantes
        await db.demande_validation.update(
            { 
                statut: 'annulé',
                commentaire: "Demande rejetée lors d'un tour précédent"
            },
            {
                where: {
                    demande_id: demandeId,
                    ordre: { [Op.gt]: validationEnAttente.ordre },
                    statut: { [Op.in]: ['en attente', 'initial'] }
                },
                transaction
            }
        );

        // Mettre à jour le statut de la demande
        await demande.update(
            { status: 'rejetée' },
            { transaction }
        );

        await transaction.commit();

        // Récupérer la demande mise à jour
        const demandeMiseAJour = await db.demande.findByPk(demandeId, {
            include: [
                {
                    model: db.demande_validation,
                    as: 'validations',
                    include: [{ 
                        model: db.user, 
                        as: 'user', 
                        attributes: ['id', 'username', 'role', 'signature_image_url'] 
                    }]
                },
                { model: db.demande_detail, as: 'details' },
                { model: db.journal, as: 'journal' },
                { 
                    model: db.user, 
                    as: 'user', 
                    attributes: ['id', 'username'] 
                }
            ]
        });

        res.status(200).json({
            message: "Demande rejetée avec succès",
            demande: demandeMiseAJour,
            tourRejete: validationEnAttente.ordre
        });

    } catch (error) {
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }
        console.error('❌ Erreur rejet tour:', error);
        res.status(500).json({ 
            message: "Erreur interne lors du rejet du tour",
            error: error.message 
        });
    }
};