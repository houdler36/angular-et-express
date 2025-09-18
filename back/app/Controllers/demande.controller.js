const db = require('../Models');
const { Op } = require("sequelize");
const { SEUIL_VALIDATION_DAF } = require('../Config/businessRules');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

//ssssconst Op = db.Sequelize.Op; // Assuming you have this line
// Fichier: demande.controller.js


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

        const demande = await db.demande.findByPk(demandeId, {
            include: [{ 
                model: db.demande_validation,
                as: 'validations', 
                include: [{ model: db.user, as: 'user' }]
            }],
            transaction
        });

        if (!demande) {
            await transaction.rollback();
            return res.status(404).send({ message: "Demande introuvable." });
        }

        // Trouver la validation correcte de manière sûre
        const validationActuelle = await db.demande_validation.findOne({
            where: {
                demande_id: demandeId,
                user_id: userId,
                statut: 'en attente' // S'assurer qu'on ne modifie que la validation en attente
            },
            transaction,
            order: [['ordre', 'ASC']] // S'assurer que c'est le bon tour
        });

        if (!validationActuelle) {
            await transaction.rollback();
            return res.status(403).send({ message: "Ce n'est pas votre tour ou la demande est déjà validée/rejetée." });
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
        
        // Mettez à jour la validation en utilisant la nouvelle URL de signature
        await validationActuelle.update(
            { 
                statut: 'validé', 
                commentaire, 
                signature_validation_url: signatureUrl,
                date_validation: new Date() 
            },
            { transaction }
        );

        // ... (Le reste de votre logique pour passer au tour suivant)
        const validationsEnAttente = await db.demande_validation.findAll({
            where: { demande_id: demandeId, statut: 'en attente' },
            transaction
        });

        if (validationsEnAttente.length > 0) {
            await transaction.commit();
            return res.status(200).send({ message: "Validation enregistrée. En attente des autres validateurs du même ordre." });
        } else {
            // ... (Le reste de votre logique de finalisation)
            await db.demande.update({ status: DEMANDE_STATUS.APPROUVEE }, { where: { id: demandeId }, transaction });

            const journal = await db.journal.findByPk(demande.journal_id, { transaction });
            let nouveauSolde = parseFloat(journal.solde || 0);
            if (demande.type === 'DED') nouveauSolde -= parseFloat(demande.montant_total);
            else if (demande.type === 'Recette' || demande.type === 'ERD') nouveauSolde += parseFloat(demande.montant_total);

            const now = new Date();
            await demande.update({
                date_approuvee: now,
                soldeProgressif: nouveauSolde 
            }, { transaction });

            await journal.update({ solde: nouveauSolde }, { transaction });
        }

        await transaction.commit();
        res.status(200).send({ message: "Demande validée avec succès." });

    } catch (err) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error(err);
        res.status(500).send({ message: "Erreur interne lors de la validation." });
    }
};

// Fichier de constantes pour éviter les chaînes de caractères littérales
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
    PAS_ENCORE: 'pas encore'
};

const USER_ROLES = {
    DAF: 'daf',
    RH: 'rh'
};

// AJOUTEZ CETTE LIGNE POUR DÉFINIR LA CONSTANTE MANQUANTE
const DEMANDE_TYPE = {
    DED: 'DED'
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

        // --- Créer la demande sans toucher au solde ---
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
                { model: db.demande_validation, as: 'validations', include: [{ model: db.user, as: 'user', attributes: ['id', 'username', 'role'] }] }
            ]
        });

        res.status(201).send(demandeComplete);

    } catch (err) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error(err);
        res.status(500).send({ message: err.message || "Erreur lors de la création de la demande." });
    }
};

exports.getDemandesDAFAValider = async (req, res) => {
    const userId = Number(req.userId);
    try {
        // Étape 1: Vérifier si l'utilisateur est bien le DAF pour des raisons de sécurité.
        const dafUser = await db.user.findByPk(userId);
        if (!dafUser || dafUser.role !== 'daf') {
            return res.status(403).send({ message: "Seul le DAF peut accéder à cette ressource." });
        }

        // Étape 2: Récupérer les demandes qui correspondent aux critères:
        // - Montant total supérieur au seuil DAF.
        const demandes = await db.demande.findAll({
            where: {
                montant_total: {
                    [Op.gt]: SEUIL_VALIDATION_DAF 
                }
            },
            include: [
                {
                    model: db.demande_validation,
                    as: 'validations',
                    where: {
                        statut: 'en attente'
                    },
                    required: true,
                    include: [{ model: db.user, as: 'user', attributes: ['id', 'username', 'role'] }]
                },
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

        // Étape 3: Filtrer les demandes côté serveur pour s'assurer que l'utilisateur est le prochain validateur.
        const demandesFiltrees = demandes.filter(demande => {
            // Trouver la validation en attente avec le plus petit "ordre"
            const validationsEnAttente = demande.validations.filter(v => v.statut === 'en attente');
            if (validationsEnAttente.length === 0) {
                return false;
            }

            // Trier les validations par ordre pour trouver la prochaine
            validationsEnAttente.sort((a, b) => a.ordre - b.ordre);
            const prochaineValidation = validationsEnAttente[0];

            // S'assurer que le prochain validateur est bien l'utilisateur DAF
            return prochaineValidation.user_id === userId;
        }).map(demande => {
            // Ajouter la propriété estTourUtilisateur pour le front-end
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
// Fichier: demande.controller.js
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
                    // On demande la colonne 'signature_validation_url' ici
                    attributes: [
                        'id',
                        'statut',
                        'ordre',
                        'date_validation',
                        'commentaire',
                        'signature_validation_url' // Cette colonne est bien dans la table 'demande_validations'
                    ],
                    include: [{
                        model: db.user,
                        as: 'user',
                        // On ne demande que les attributs qui se trouvent dans la table 'users'
                        attributes: ['username', 'signature_image_url']
                    }]
                }
            ]
        });

        if (!demande) {
            return res.status(404).send({ message: `Demande ${id} introuvable.` });
        }

        // --- Logique pour choisir la bonne signature ---
        const demandeAvecSignaturesStatiques = demande.toJSON();
        demandeAvecSignaturesStatiques.validations = demandeAvecSignaturesStatiques.validations.map(validation => {
            const signatureFinale = validation.signature_validation_url || (validation.user ? validation.user.signature_image_url : null);
            return {
                ...validation,
                signature_image_url_finale: signatureFinale
            };
        });

        res.send(demandeAvecSignaturesStatiques);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Erreur lors de la récupération de la demande." });
    }
};
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
    model: db.personne, 
    as: 'responsible_pj', 
    attributes: ['nom', 'prenom'] 
}, // CORRECTION: retrait des attributs nom et prenom
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

// --- Récupérer les demandes dont pj_status = 'pas encore' ---
// --- Récupérer les demandes dont pj_status = 'pas encore' et le statut est 'approuvée' et le type est 'DED' ---
exports.getDemandesPJNonFournies = async (req, res) => {
    try {
        const demandes = await db.demande.findAll({
            // Mise à jour de la clause WHERE pour inclure les trois conditions
            where: {
                pj_status: PJ_STATUS.PAS_ENCORE,
                status: DEMANDE_STATUS.APPROUVEE,
                type: DEMANDE_TYPE.DED
            },
            include: [
                { model: db.user, attributes: ['id', 'username'], as: 'user' },
                { model: db.demande_detail, as: 'details' },
                { model: db.personne, as: 'responsible_pj' }, // CORRECTION: retrait des attributs nom et prenom
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
        res.status(500).send({ message: "Erreur lors de la récupération des demandes PJ non fournies." });
    }
};


// --- Mettre à jour le pj_status d'un DED ---
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

// --- Validation d'une demande (RH et DAF) ────────────────────────────────
// Fichier: demande.controller.js




// (Le reste de votre code, comme exports.create, exports.findOne, etc., est inchangé)

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

        // 1. Trouver la validation spécifique à mettre à jour de manière sécurisée
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

        // 2. Vérifier si c'est bien le bon tour de validation
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
        
        // 3. Mettre à jour la validation en utilisant la nouvelle URL de signature statique
        await validationActuelle.update(
            { 
                statut: 'validé', 
                commentaire, 
                signature_validation_url: signatureUrl, // La signature est maintenant statique
                date_validation: new Date() 
            },
            { transaction }
        );

        // 4. Vérifier si d'autres validateurs du même ordre ont encore un statut 'en attente'
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

        // 5. Si toutes les validations de cet ordre sont terminées, passer au suivant ou finaliser
        const nextOrder = validationActuelle.ordre + 1;
        const nextValidations = await db.demande_validation.count({
            where: {
                demande_id: demandeId,
                ordre: nextOrder
            },
            transaction
        });

        if (nextValidations > 0) {
            // Passer au prochain ordre
            await db.demande_validation.update(
                { statut: 'en attente' },
                { where: { demande_id: demandeId, ordre: nextOrder }, transaction }
            );
        } else {
            // Finaliser la demande, car il n'y a plus de validateurs
            const demande = await db.demande.findByPk(demandeId, { transaction });
            if (!demande) {
                await transaction.rollback();
                return res.status(404).send({ message: "Demande introuvable lors de la finalisation." });
            }
            await demande.update({ status: 'approuvée' }, { transaction });
            
            // Logique pour les soldes, etc.
            const journal = await db.journal.findByPk(demande.journal_id, { transaction });
            let nouveauSolde = parseFloat(journal.solde || 0);
            if (demande.type === 'DED') nouveauSolde -= parseFloat(demande.montant_total);
            else if (demande.type === 'Recette' || demande.type === 'ERD') nouveauSolde += parseFloat(demande.montant_total);

            await demande.update({
                date_approuvee: new Date(),
                soldeProgressif: nouveauSolde 
            }, { transaction });

            await journal.update({ solde: nouveauSolde }, { transaction });
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

// --- Demandes à valider par l'utilisateur connecté (RH/DAF) ---
exports.getDemandesAValider = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).send({ message: "Utilisateur non authentifié." });
        }

        const demandes = await db.demande.findAll({
            include: [
                { model: db.demande_detail, as: 'details' },
                { model: db.personne, as: 'responsible_pj' }, // CORRECTION: retrait des attributs nom et prenom
                {
                    model: db.demande_validation,
                    as: 'validations',
                    include: [{ model: db.user, as: 'user', attributes: ['id', 'username', 'role'] }]
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

        const demandesFiltrees = demandes.filter(d => {
            const validationsActives = d.validations.filter(v => v.statut === 'en attente');
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

// --- Demandes en attente chez un autre validateur ---
// CORRECTION : Remplacement de sequelize.literal par une requête plus propre en utilisant Op.notIn
exports.getDemandesEnAttenteAutres = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).send({ message: "Utilisateur non authentifié." });

        // Étape 1 : Récupérer les ID des demandes pour lesquelles l'utilisateur est un validateur en attente
        const demandeIdsToExclude = await db.demande_validation.findAll({
            attributes: ['demande_id'],
            where: {
                user_id: userId,
                statut: VALIDATION_STATUS.EN_ATTENTE
            },
            raw: true
        });

        const excludedIds = demandeIdsToExclude.map(validation => validation.demande_id);
        
        // Étape 2 : Récupérer les demandes en attente qui ne sont pas dans la liste des ID exclus
        const demandes = await db.demande.findAll({
            where: {
                status: DEMANDE_STATUS.EN_ATTENTE,
                id: {
                    [Op.notIn]: excludedIds
                }
            },
            include: [
                { model: db.personne, as: 'responsible_pj' }, // CORRECTION: retrait des attributs nom et prenom
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
                        { model: db.journalValider, as: 'validationsConfig', include: [{ model: db.user, as: 'user' }] }
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

// --- Demandes déjà finalisées ---
exports.getDemandesFinalisees = async (req, res) => {
    try {
        const demandes = await db.demande.findAll({
            where: {
                status: { [Op.in]: ['approuvée', 'rejetée'] }
            },
            include: [
                { model: db.personne, as: 'responsible_pj' }, // CORRECTION: retrait des attributs nom et prenom
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
                        { model: db.journalValider, as: 'validationsConfig', include: [{ model: db.user, as: 'user' }] }
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
// Récupérer les stats des demandes pour l'utilisateur connecté uniquement
exports.getDemandeStats = async (req, res) => {
    try {
        const userId = req.userId; // récupéré par verifyToken

        const stats = await db.demande.findAll({
            attributes: [
                [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'total'],
                [db.Sequelize.fn('SUM', db.Sequelize.literal(`CASE WHEN status = 'en attente' THEN 1 ELSE 0 END`)), 'enAttente'],
                [db.Sequelize.fn('SUM', db.Sequelize.literal(`CASE WHEN status = 'approuvée' THEN 1 ELSE 0 END`)), 'approuvees'],
                [db.Sequelize.fn('SUM', db.Sequelize.literal(`CASE WHEN status = 'rejetée' THEN 1 ELSE 0 END`)), 'rejetees']
            ],
            where: { userId }
        });

        res.json(stats[0] || { total: 0, enAttente: 0, approuvees: 0, rejetees: 0 });

    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err.message });
    }
};

exports.getRapportDemandesApprouvees = async (req, res) => {
    const journalId = req.params.journalId;

    try {
        const demandes = await db.demande.findAll({
            where: {
                status: DEMANDE_STATUS.APPROUVEE,
                journal_id: journalId
            },
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
            ],
            include: [
                { model: db.user, as: 'user', attributes: ['username'] },
                { model: db.personne, as: 'responsible_pj' }, // CORRECTION: retrait des attributs nom et prenom
                { model: db.journal, as: 'journal', attributes: [['nom_journal', 'nom']] }
            ]
        });

        // Formater la date côté serveur
        const demandesFormatees = demandes.map(d => {
            const obj = d.toJSON();
            obj.date_approuve = obj.date_approuvee 
                ? new Date(obj.date_approuvee).toISOString().split('T')[0] 
                : null;
            delete obj.date_approuvee; // facultatif si tu veux supprimer l’original
            return obj;
        });

        res.status(200).json(demandesFormatees);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la récupération du rapport', error: err.message });
    }
};

// demande.controller.js
exports.getDemandesByProjectName = async (req, res) => {
  const nomProjet = req.params.nomProjet;

  try {
    const demandes = await db.demande.findAll({
      include: [
        {
          model: db.journal,
          as: 'journal',
          where: { nom_projet: nomProjet } // filtre sur le projet
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
      return res.status(200).send([]); // retourne un tableau vide si aucune demande
    }

    res.status(200).send(demandes);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || "Erreur serveur" });
  }
};
// exports.getBudgetInfoByCode
exports.getBudgetInfoByCode = async (req, res) => {
  const codeBudget = req.params.codeBudget;
  try {
    const budgetInfo = await db.budget.findAll({
      attributes: [
        'code_budget',
        'budget_annuel',
        'budget_trimestre_1',
        'budget_trimestre_2',
        'budget_trimestre_3',
        'budget_trimestre_4'
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
            attributes: [] // Les attributs doivent être vides ici
          }
        }
      ]
    });
    if (!budgetInfo || budgetInfo.length === 0) {
      return res.status(404).send({ message: "Aucune information de budget trouvée pour ce code." });
    }
    // Le reste du code de formatage était correct, car il renvoie les noms que votre frontend attend.
    const formattedResults = budgetInfo.flatMap(info =>
      info.get('journals').map(journal => ({
        code_budget: info.get('code_budget'),
        nom_projet: journal.get('nom_projet'),
        budget_annuel: info.get('budget_annuel'),
        budget_trimestre_1: info.get('budget_trimestre_1'),
        budget_trimestre_2: info.get('budget_trimestre_2'),
        budget_trimestre_3: info.get('budget_trimestre_3'),
        budget_trimestre_4: info.get('budget_trimestre_4'),
      }))
    );
    res.status(200).send(formattedResults);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || "Erreur serveur" });
  }
};
// demande.controller.js
// demande.controller.js
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
            'budget_trimestre_1', // Ajouté
            'budget_trimestre_2', // Ajouté
            'budget_trimestre_3', // Ajouté
            'budget_trimestre_4'  // Ajouté
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
exports.updateStatus = async (req, res) => {
  const id = req.params.id;
  const { status, comments } = req.body;

  try {
    // Utiliser db.demande au lieu de Demande
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
// Dans demande.controller.js
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
                            as: 'budget', // This is the correct alias for the nested model
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
            // ✅ CORRECTION: Move all filtering logic to a single, top-level `where` clause
            where: {
                // The filter for 'nom_projet' is on the 'journal' model
                '$journal.nom_projet$': {
                    [Op.like]: `%${nom_projet}%`
                },
                // The filter for 'code_budget' is on the 'budget' model, nested inside 'details'
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