const db = require("../Models");
const Journal = db.journal;
const Budget = db.budget;
const User = db.user;
const JournalValider = db.journalValider;
const JournalBudget = db.journalBudget; // Ajout du modèle JournalBudget
const Demande = db.demande; // Ajout du modèle Demande

const { Op } = require("sequelize");

// ─── Création de journal ──────────────────────────────────────────────
exports.create = async (req, res) => {
    const { nom_journal, nom_projet, budgetIds } = req.body;
    
    // Vérification des données de base
    if (!nom_journal || !nom_projet) {
        return res.status(400).send({ message: "Le nom du journal et du projet ne peuvent pas être vides." });
    }
    
    const t = await db.sequelize.transaction();
    try {
        // Crée le journal en premier
        const journal = await Journal.create({ nom_journal, nom_projet }, { transaction: t });

        // Si des budgets sont fournis, utilisez la méthode d'association de Sequelize
        if (budgetIds && Array.isArray(budgetIds) && budgetIds.length > 0) {
            const budgets = await Budget.findAll({
                where: { id_budget: { [Op.in]: budgetIds } },
                transaction: t
            });
            // Cette méthode gère l'ajout des entrées dans la table de liaison `journal_budgets`
            await journal.addBudgets(budgets, { transaction: t });
        }
        
        // Nouvelle logique : Trouver tous les utilisateurs avec le rôle 'rh' et les assigner comme valideurs
        const rhUsers = await User.findAll({ where: { role: 'rh' }, transaction: t });

        // Associez les valideurs RH dans le bon ordre en utilisant bulkCreate
        if (rhUsers.length > 0) {
            const journalValidateurs = rhUsers.map((user, index) => ({
                journal_id: journal.id_journal,
                user_id: user.id,
                ordre: index + 1,
                statut: 'en attente',
                createdAt: new Date(),
                updatedAt: new Date(),
            }));
            await db.journalValider.bulkCreate(journalValidateurs, { transaction: t });
        } else {
            // Gérer le cas où il n'y a pas d'utilisateurs RH
            await t.rollback();
            return res.status(400).send({ message: "Aucun utilisateur avec le rôle 'rh' trouvé pour être un validateur." });
        }

        await t.commit();

        const newJournal = await Journal.findByPk(journal.id_journal, {
            include: [
                {
                    model: Budget,
                    as: 'budgets',
                    through: { attributes: [] }
                },
                {
                    model: db.journalValider,
                    as: 'validationsConfig',
                    include: [{ model: User, as: 'user', attributes: ['username', 'email'] }]
                }
            ]
        });

        res.status(201).send({ message: "Journal créé avec succès !", journal: newJournal });

    } catch (err) {
        await t.rollback();
        console.error("Erreur lors de la création du journal :", err);
        res.status(500).send({ message: err.message || "Une erreur est survenue lors de la création du journal." });
    }
};

// Fonction utilitaire pour transformer un journal
const transformJournal = (journal) => {
    const data = journal.toJSON();
    return {
        ...data,
        valideurs: (data.validationsConfig || []).map(vc => ({
            username: vc.user?.username || null,
            email: vc.user?.email || null,
            ordre: vc.ordre
        })),
        validationsConfig: undefined // supprime la clé brute
    };
};

// ─── Récupération de tous les journaux ────────────────────────────────────────────────
exports.findAll = async (req, res) => {
    try {
        const journals = await Journal.findAll({
            include: [
                {
                    model: Budget,
                    as: 'budgets',
                    through: { attributes: [] }
                },
                {
                    model: db.journalValider,
                    as: 'validationsConfig', // vérifier l'alias réel ici
                    include: [
                        { model: User, as: 'user', attributes: ['username', 'email'] }
                    ]
                }
            ]
        });

        res.send(journals.map(transformJournal));
    } catch (err) {
        console.error("Erreur lors de la récupération de tous les journaux :", err);
        res.status(500).send({ message: err.message || "Une erreur est survenue lors de la récupération des journaux." });
    }
};

// ─── Récupération d'un journal par ID ────────────────────────────────────────────────
exports.findOne = async (req, res) => {
    // CORRECTION : Utiliser req.params.id pour correspondre aux routes
    const id = req.params.id;
    try {
        const journal = await Journal.findByPk(id, {
            include: [
                {
                    model: Budget,
                    as: 'budgets',
                    through: { attributes: [] }
                },
                {
                    model: db.journalValider,
                    as: 'validationsConfig', // vérifier l'alias réel ici
                    include: [
                        { model: User, as: 'user', attributes: ['username', 'email'] }
                    ]
                }
            ]
        });

        if (!journal) {
            return res.status(404).send({ message: "Journal introuvable." });
        }

        res.send(transformJournal(journal));
    } catch (err) {
        console.error(`Erreur lors de la récupération du journal avec l'id=${id} :`, err);
        res.status(500).send({ message: `Erreur lors de la récupération du journal avec l'id=${id}.` });
    }
};

// ─── Mise à jour d'un journal ─────────────────────────────────────────
exports.update = async (req, res) => {
    const id = req.params.id;
    const { budgets, ...journalData } = req.body;
    
    console.log(`[UPDATE] Tentative de mise à jour pour le journal id=${id}`);
    console.log(`[UPDATE] Données reçues:`, req.body);

    const t = await db.sequelize.transaction();
    try {
        const journalInstance = await Journal.findByPk(id, { transaction: t });

        if (!journalInstance) {
            await t.rollback();
            console.log(`[UPDATE] Journal id=${id} introuvable.`);
            return res.status(404).send({ message: `Impossible de mettre à jour le journal avec l'id=${id}. Journal introuvable.` });
        }

        console.log(`[UPDATE] Mise à jour des données du journal.`);
        await journalInstance.update(journalData, { transaction: t });

        if (budgets && Array.isArray(budgets) && budgets.length >= 0) {
            console.log(`[UPDATE] Mise à jour des budgets.`);
            if (budgets.length > 0) {
                const budgetIds = budgets.map(b => b.id_budget);
                
                const existingBudgets = await Budget.findAll({ where: { id_budget: { [Op.in]: budgetIds } }, transaction: t });
                if (existingBudgets.length !== budgetIds.length) {
                    await t.rollback();
                    console.log(`[UPDATE] Erreur: Un ou plusieurs budgets fournis n'existent pas.`);
                    return res.status(400).send({ message: "Un ou plusieurs budgets fournis n'existent pas." });
                }
                
                await JournalBudget.destroy({ where: { journal_id: id }, transaction: t });
                await journalInstance.setBudgets(existingBudgets, { transaction: t });
            } else {
                console.log(`[UPDATE] Aucun budget fourni. Suppression des budgets existants.`);
                await JournalBudget.destroy({ where: { journal_id: id }, transaction: t });
            }
        }
        
        // Nouvelle logique : Mettre à jour les valideurs en fonction des utilisateurs RH
        console.log(`[UPDATE] Mise à jour des valideurs (basée sur le rôle 'rh').`);
        const rhUsers = await User.findAll({ where: { role: 'rh' }, transaction: t });
        
        // S'il n'y a pas d'utilisateurs RH, on ne fait rien.
        if (rhUsers.length > 0) {
            await JournalValider.destroy({ where: { journal_id: id }, transaction: t });
            
            const journalValidateurs = rhUsers.map((user, index) => ({
                journal_id: id,
                user_id: user.id,
                ordre: index + 1,
                statut: 'en attente',
                createdAt: new Date(),
                updatedAt: new Date(),
            }));
            await JournalValider.bulkCreate(journalValidateurs, { transaction: t });
        } else {
            console.log("[UPDATE] Aucun utilisateur avec le rôle 'rh' trouvé. Les valideurs existants sont conservés.");
        }
        
        await t.commit();
        console.log(`[UPDATE] Transaction commitée avec succès.`);
        res.send({ message: "Journal mis à jour avec succès." });

    } catch (err) {
        await t.rollback();
        console.log(`[UPDATE] Erreur lors de la mise à jour:`, err);
        res.status(500).send({ message: err.message || `Erreur lors de la mise à jour du journal avec l'id=${id}` });
    }
};

// ─── Suppression d'un journal ─────────────────────────────────────────
exports.delete = async (req, res) => {
    const id = req.params.id;
    const t = await db.sequelize.transaction();
    try {
        const journal = await Journal.findByPk(id, { transaction: t });

        if (!journal) {
            await t.rollback();
            return res.status(404).send({ message: `Impossible de supprimer le journal avec l'id=${id}. Il est introuvable.` });
        }
        
        // CORRECTION : Supprimer d'abord les demandes associées
        await Demande.destroy({ where: { journal_id: id }, transaction: t });
        // Suppression explicite des associations pour éviter les erreurs de clés étrangères
        await JournalBudget.destroy({ where: { journal_id: id }, transaction: t });
        await JournalValider.destroy({ where: { journal_id: id }, transaction: t });

        // Suppression du journal
        await journal.destroy({ transaction: t });
        
        await t.commit();
        res.send({ message: "Le journal a été supprimé avec succès !" });
    } catch (err) {
        await t.rollback();
        console.error("Erreur lors de la suppression du journal :", err);
        res.status(500).send({ message: err.message || `Impossible de supprimer le journal avec l'id=${id}.` });
    }
};
