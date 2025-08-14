// Fichier: demande.controller.js

const db = require('../Models');
const Demande = db.demande;
const DemandeDetail = db.demande_detail;
const Journal = db.journal;
const JournalValider = db.journalValider;
const User = db.user;
const { Op } = require("sequelize");
const fs = require('fs');
const path = require('path');
// Créer une nouvelle demande et ses détails
exports.create = async (req, res) => {
    // Vérification de la présence des champs obligatoires
    const { userId, journal_id, date, details } = req.body;
    if (!userId || !journal_id || !date || !details || !Array.isArray(details) || details.length === 0) {
        return res.status(400).send({
            message: "Le contenu de la demande et ses détails ne peuvent pas être vides."
        });
    }

    const t = await db.sequelize.transaction();
    let nouvelleDemande;
    try {
        // 1. Création de la demande principale
        nouvelleDemande = await Demande.create({
            userId: userId,
            type: req.body.type,
            journal_id: journal_id,
            date: date,
            expected_justification_date: req.body.expected_justification_date,
            pj_status: req.body.pj_status,
            resp_pj_id: req.body.resp_pj_id,
            description: req.body.description,
            status: 'en attente',
            montant_total: req.body.montant_total || 0
        }, { transaction: t });

        // 2. Préparation des détails pour l'insertion
        const detailsAvecDemandeId = details.map(detail => ({
            ...detail,
            demande_id: nouvelleDemande.id
        }));

        // 3. Création de tous les détails de la demande
        await DemandeDetail.bulkCreate(detailsAvecDemandeId, { transaction: t });
        
        // ⭐ Correction pour initialiser le statut du premier validateur
        // 4. Récupérer les validateurs pour le journal_id
        const validateursDuJournal = await JournalValider.findAll({
            where: { journal_id: journal_id },
            order: [['ordre', 'ASC']],
            transaction: t
        });

        if (validateursDuJournal.length === 0) {
            await t.rollback();
            return res.status(404).send({
                message: "Aucun validateur trouvé pour ce journal. La demande ne peut pas être créée."
            });
        }

        // Mettre le statut du premier validateur à 'en attente'
        await JournalValider.update(
            { statut: 'en attente' }, 
            { where: { id: validateursDuJournal[0].id }, transaction: t }
        );
        
        // 5. On valide la transaction
        await t.commit();
        
    } catch (err) {
        // En cas d'erreur avant le commit, on annule toutes les opérations
        await t.rollback();
        console.error("Erreur lors de la création de la demande et de ses détails:", err);
        return res.status(500).send({
            message: err.message || "Une erreur s'est produite lors de la création de la demande et de ses détails."
        });
    }

    // Le code qui suit ne s'exécute que si la transaction a été validée avec succès
    try {
        // 6. On récupère la nouvelle demande avec ses détails
        const demandeComplete = await Demande.findByPk(nouvelleDemande.id, {
            include: [{ 
                model: DemandeDetail, 
                as: 'details',
                attributes: [
                    'id', 'demande_id', 'nature', 'libelle', 'amount', 
                    'beneficiaire', 'nif_exists', 'numero_compte', 
                    'budget_id', 'status_detail'
                ]
            }]
        });

        res.status(201).send(demandeComplete);
    } catch (err) {
        console.error("Erreur lors de la récupération de la demande après l'insertion:", err);
        res.status(500).send({
            message: "La demande a été créée mais une erreur est survenue lors de sa récupération."
        });
    }
};

// Récupérer toutes les demandes pour un utilisateur spécifique
exports.findAll = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).send({ message: "Utilisateur non authentifié." });
        }

        const demandes = await Demande.findAll({
            where: { userId: userId },
            include: [
                { model: User, attributes: ['username'], as: 'user' },
                { model: Journal, attributes: ['nom_journal', 'nom_projet'], as: 'journal' }
            ]
        });
        res.send(demandes);
    } catch (err) {
        console.error("Erreur lors de la récupération des demandes:", err);
        res.status(500).send({
            message: err.message || "Une erreur s'est produite lors de la récupération des demandes."
        });
    }
};

// Récupérer une seule demande par ID avec ses détails et ses validateurs (CORRIGÉ)
exports.findOne = async (req, res) => {
    const id = req.params.id;

    try {
        const demande = await Demande.findByPk(id, {
            include: [
                { model: User, attributes: ['username'], as: 'user' },
                { 
                    model: Journal, 
                    as: 'journal',
                    include: [{
                        model: JournalValider,
                        as: 'validations',
                        include: [{
                            model: User,
                            as: 'user'
                        }]
                    }]
                },
                {
                    model: DemandeDetail,
                    as: 'details',
                    attributes: [
                        'id', 'demande_id', 'nature', 'libelle', 
                        'beneficiaire', 'amount', 'nif_exists', 
                        'numero_compte', 'budget_id', 'status_detail'
                    ]
                }
            ]
        });

        if (demande) {
            res.send(demande);
        } else {
            res.status(404).send({
                message: `Impossible de trouver la demande avec l'id=${id}.`
            });
        }
    } catch (err) {
        console.error("Erreur lors de la récupération de la demande:", err);
        res.status(500).send({
            message: err.message || "Erreur lors de la récupération de la demande avec l'id=" + id
        });
    }
};

// Mettre à jour une demande par ID
exports.update = async (req, res) => {
    const id = req.params.id;

    try {
        const [num] = await Demande.update(req.body, {
            where: { id: id }
        });

        if (num === 1) {
            res.send({
                message: "La demande a été mise à jour avec succès."
            });
        } else {
            res.send({
                message: `Impossible de mettre à jour la demande avec l'id=${id}. Peut-être que la demande n'a pas été trouvée ou que le corps de la requête est vide.`
            });
        }
    } catch (err) {
        res.status(500).send({
            message: "Erreur lors de la mise à jour de la demande avec l'id=" + id
        });
    }
};

// Supprimer une demande par ID
exports.delete = async (req, res) => {
    const id = req.params.id;

    try {
        const num = await Demande.destroy({
            where: { id: id }
        });

        if (num === 1) {
            res.send({
                message: "La demande a été supprimée avec succès !"
            });
        } else {
            res.send({
                message: `Impossible de supprimer la demande avec l'id=${id}. Peut-être que la demande n'a pas été trouvée.`
            });
        }
    } catch (err) {
        res.status(500).send({
            message: "Impossible de supprimer la demande avec l'id=" + id
        });
    }
};

// Supprimer toutes les demandes
exports.deleteAll = async (req, res) => {
    try {
        const nums = await Demande.destroy({
            where: {},
            truncate: false
        });
        res.send({ message: `${nums} demandes ont été supprimées avec succès !` });
    } catch (err) {
        res.status(500).send({
            message: err.message || "Une erreur s'est produite lors de la suppression de toutes les demandes."
        });
    }
};

// Récupérer les statistiques de demandes par statut pour un utilisateur
exports.getDemandeStats = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).send({ message: "Utilisateur non authentifié." });
        }

        const stats = await Demande.count({
            where: { userId: userId },
            group: ['status']
        });

        const formattedStats = stats.reduce((acc, item) => {
            acc[item.status] = item.count;
            return acc;
        }, {});

        res.status(200).json(formattedStats);
    } catch (err) {
        console.error("Erreur lors de la récupération des statistiques:", err);
        res.status(500).send({
            message: err.message || "Une erreur s'est produite lors de la récupération des statistiques."
        });
    }
};

// Valider une demande séquentiellement
exports.validerDemande = async (req, res) => {
    const demandeId = req.params.id;
    const userId = req.userId;
    const { commentaire } = req.body; 
    
    const t = await db.sequelize.transaction();

    try {
        const demande = await Demande.findByPk(demandeId, {
            include: [{
                model: Journal,
                as: 'journal'
            }],
            transaction: t
        });

        if (!demande) {
            await t.rollback();
            return res.status(404).send({ message: "Demande non trouvée." });
        }
        
        if (!demande.journal) {
            await t.rollback();
            return res.status(400).send({ message: "La demande n'est pas liée à un journal de validation." });
        }
        
        const validations = await JournalValider.findAll({
            where: { journal_id: demande.journal.id_journal },
            order: [['ordre', 'ASC']],
            transaction: t
        });
        
        // Vérifie si l'utilisateur actuel est le validateur dont le statut est 'en attente'
        const validateurActuel = validations.find(v => v.user_id === userId && v.statut === 'en attente');

        if (!validateurActuel) {
            await t.rollback();
            return res.status(403).send({ message: "Vous n'êtes pas le prochain validateur ou la demande n'est pas en attente de votre validation." });
        }

        // Met à jour le statut du validateur actuel
        await JournalValider.update({ 
            statut: 'approuvé',
            date_validation: new Date(),
            commentaire: commentaire,
        }, {
            where: { id: validateurActuel.id },
            transaction: t
        });
        
        // Met à jour le statut des détails de la demande
        await DemandeDetail.update(
            { status_detail: 'approuvé' },
            { where: { demande_id: demandeId, status_detail: 'en attente' }, transaction: t }
        );

        // Trouve le prochain validateur dans la chaîne
        const prochainValidateur = validations.find(v => v.ordre === validateurActuel.ordre + 1);

        if (prochainValidateur) {
            // S'il y a un prochain validateur, met son statut à 'en attente'
            await JournalValider.update({ statut: 'en attente' }, {
                where: { id: prochainValidateur.id },
                transaction: t
            });
            // Et met à jour le statut de la demande principale à 'en validation'
            await Demande.update({ status: 'en validation' }, { where: { id: demandeId }, transaction: t });
        } else {
            // S'il n'y a pas de prochain validateur, la demande est finalisée
            await Demande.update({ status: 'approuvée' }, { where: { id: demandeId }, transaction: t });
        }
        
        await t.commit();
        res.status(200).send({ message: `La validation de la demande ${demandeId} a été enregistrée avec succès.` });

    } catch (error) {
        if (t.finished !== 'commit') {
            await t.rollback();
        }
        console.error("Erreur lors de la validation de la demande:", error);
        res.status(500).send({ message: "Erreur interne du serveur lors de la validation." });
    }
};
// Refuser une demande
exports.refuserDemande = async (req, res) => {
    const demandeId = req.params.id;
    const userId = req.userId;
    const { commentaire } = req.body;
    
    const t = await db.sequelize.transaction();

    try {
        const demande = await Demande.findByPk(demandeId, {
            include: [{
                model: Journal,
                as: 'journal'
            }],
            transaction: t
        });

        if (!demande) {
            await t.rollback();
            return res.status(404).send({ message: "Demande non trouvée." });
        }
        
        if (!demande.journal) {
            await t.rollback();
            return res.status(400).send({ message: "La demande n'est pas liée à un journal de validation." });
        }

        const validations = await JournalValider.findAll({
            where: { journal_id: demande.journal.id_journal },
            order: [['ordre', 'ASC']],
            transaction: t
        });

        const validateurActuel = validations.find(v => v.user_id === userId && v.statut === 'en attente');
        if (!validateurActuel) {
            await t.rollback();
            return res.status(403).send({ message: "Vous n'êtes pas le validateur actuel de cette demande." });
        }

        // Mettre à jour le statut du validateur et de la demande
        await JournalValider.update({ statut: 'rejeté', commentaire: commentaire, date_validation: new Date() }, {
            where: { id: validateurActuel.id },
            transaction: t
        });
        await Demande.update({ status: 'rejetée', description: demande.description + '\n' + `(Rejetée par ${userId} : ${commentaire})` }, {
            where: { id: demandeId },
            transaction: t
        });
        
        await t.commit();

        res.status(200).send({ message: `La demande ${demandeId} a été rejetée avec succès.` });
    } catch (error) {
        if (t.finished !== 'commit') {
            await t.rollback();
        }
        console.error("Erreur lors du rejet de la demande:", error);
        res.status(500).send({ message: "Erreur interne du serveur lors du rejet de la demande." });
    }
};

// Fonction obsolète, gérée par `validerDemande` et `refuserDemande`
exports.updateDemandeStatus = (req, res) => {
    res.status(501).send({ message: "Cette fonctionnalité est gérée par les fonctions `validerDemande` et `refuserDemande`." });
};

// Récupérer les demandes à valider par l'utilisateur connecté
exports.getDemandesAValider = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Utilisateur non authentifié." });
        }

        const demandes = await Demande.findAll({
            include: [
                {
                    model: Journal,
                    as: 'journal',
                    include: [{
                        model: JournalValider,
                        as: 'validations',
                        required: true, // INNER JOIN
                        where: {
                            user_id: userId,
                            statut: 'en attente'
                        },
                        include: [{
                            model: User,
                            as: 'user'
                        }]
                    }]
                }
            ],
            // ❗ Retirer le "status" global ici, on filtre uniquement par validateur
            order: [['date', 'DESC']]
        });

        return res.status(200).json(demandes);

    } catch (error) {
        console.error("Erreur lors de la récupération des demandes à valider:", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};


// Récupérer les demandes qui ont été finalisées (approuvées ou rejetées) pour tous les utilisateurs
exports.getDemandesFinalisees = async (req, res) => {
    try {
        const demandes = await Demande.findAll({
            where: {
                status: {
                    [Op.in]: ['approuvée', 'rejetée']
                }
            },
            include: [
                {
                    model: Journal,
                    as: 'journal',
                    include: [{
                        model: JournalValider,
                        as: 'validations',
                        include: [{
                            model: User,
                            as: 'user'
                        }]
                    }]
                }
            ]
        });

        return res.status(200).json(demandes);

    } catch (error) {
        console.error("Erreur lors de la récupération des demandes finalisées:", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};
