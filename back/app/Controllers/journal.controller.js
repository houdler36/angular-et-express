const db = require("../Models");
const Journal = db.journal;
const Budget = db.budget;
const User = db.user;
const JournalValider = db.journalValider;
const JournalBudget = db.journalBudget;
const Demande = db.demande;

const { Op } = require("sequelize");

// ─── Création de journal ──────────────────────────────────────────────
exports.create = async (req, res) => {
    const { nom_journal, nom_projet, budgetIds, valideurs, solde } = req.body;

    if (!nom_journal || !nom_projet || !budgetIds || budgetIds.length === 0) {
        return res.status(400).send({ message: "Le nom du journal, du projet et les budgets sont obligatoires." });
    }

    const t = await db.sequelize.transaction();
    try {
        // Nouvelle vérification : s'assurer que les budgets ne sont pas déjà associés à un autre journal.
        const existingBudgetLinks = await JournalBudget.findAll({
            where: {
                id_budget: { [Op.in]: budgetIds } // CORRECTION APPORTÉE ICI
            },
            transaction: t
        });

        if (existingBudgetLinks.length > 0) {
            await t.rollback();
            const usedBudgetIds = existingBudgetLinks.map(link => link.id_budget);
            return res.status(409).send({
                message: "Un ou plusieurs budgets sont déjà associés à un autre journal.",
                usedBudgetIds: usedBudgetIds
            });
        }
        
        // Créer le journal avec solde si fourni
        const journal = await Journal.create({ nom_journal, nom_projet, solde: solde || 0 }, { transaction: t });

        // Associer les budgets
        if (budgetIds.length > 0) {
            const budgets = await Budget.findAll({
                where: { id_budget: { [Op.in]: budgetIds } },
                transaction: t
            });
            await journal.addBudgets(budgets, { transaction: t });
        }

        // Ajouter uniquement les RH comme valideurs
        if (valideurs && valideurs.length > 0) {
            const rhUsers = await User.findAll({
                where: { id: { [Op.in]: valideurs.map(v => v.user_id) }, role: 'rh' },
                transaction: t
            });

            const journalValidateurs = rhUsers.map(user => {
                const ordre = valideurs.find(v => v.user_id === user.id)?.ordre || 1;
                return {
                    journal_id: journal.id_journal,
                    user_id: user.id,
                    ordre,
                    statut: 'en attente',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
            });

            await JournalValider.bulkCreate(journalValidateurs, { transaction: t });
        }

        await t.commit();

        // Récupérer le journal avec ses budgets et valideurs RH
        const newJournal = await Journal.findByPk(journal.id_journal, {
            include: [
                { model: Budget, as: 'budgets', through: { attributes: [] } },
                { model: JournalValider, as: 'validationsConfig', include: [{ model: User, as: 'user', attributes: ['username', 'email'] }] }
            ]
        });

        res.status(201).send(newJournal);

    } catch (err) {
        if (t && !t.finished) await t.rollback();
        console.error("Erreur lors de la création du journal :", err);
        res.status(500).send({ message: err.message || "Une erreur est survenue lors de la création du journal." });
    }
}


// ─── Mise à jour d'un journal ─────────────────────────────────────────
exports.update = async (req, res) => {
    const id = req.params.id;
    const { nom_journal, nom_projet, budgetIds, valideurs, solde } = req.body;

    const t = await db.sequelize.transaction();
    try {
        const journal = await Journal.findByPk(id, { transaction: t });
        if (!journal) {
            await t.rollback();
            return res.status(404).send({ message: "Journal introuvable." });
        }

        // Mettre à jour les informations de base
        await journal.update({ nom_journal, nom_projet, solde }, { transaction: t });

        // Nouvelle vérification pour les budgets
        if (budgetIds && budgetIds.length > 0) {
            const existingBudgetLinks = await JournalBudget.findAll({
                where: {
                    id_budget: { [Op.in]: budgetIds }, // CORRECTION APPORTÉE ICI
                    journal_id: { [Op.ne]: id } // Exclure le journal en cours de modification
                },
                transaction: t
            });

            if (existingBudgetLinks.length > 0) {
                await t.rollback();
                const usedBudgetIds = existingBudgetLinks.map(link => link.id_budget);
                return res.status(409).send({
                    message: "Un ou plusieurs budgets sont déjà associés à un autre journal.",
                    usedBudgetIds: usedBudgetIds
                });
            }

            const budgets = await Budget.findAll({
                where: { id_budget: { [Op.in]: budgetIds } },
                transaction: t
            });
            await journal.setBudgets(budgets, { transaction: t });
        }

        // Gestion des valideurs RH uniquement
        if (valideurs && valideurs.length > 0) {
            // Récupérer les RH uniquement
            const rhUsers = await User.findAll({
                where: { id: { [Op.in]: valideurs.map(v => v.user_id) }, role: 'rh' },
                transaction: t
            });

            // Supprimer les anciens valideurs
            await JournalValider.destroy({ where: { journal_id: id }, transaction: t });

            // Créer les nouveaux valideurs RH
            const journalValidateurs = rhUsers.map(user => {
                const ordre = valideurs.find(v => v.user_id === user.id)?.ordre || 1;
                return {
                    journal_id: id,
                    user_id: user.id,
                    ordre,
                    statut: 'en attente',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
            });

            await JournalValider.bulkCreate(journalValidateurs, { transaction: t });
        }

        await t.commit();
        res.status(200).send({ message: "Journal mis à jour avec succès." });

    } catch (err) {
        if (t && !t.finished) await t.rollback();
        console.error("Erreur lors de la mise à jour du journal :", err);
        res.status(500).send({ message: err.message || "Erreur serveur." });
    }
};

// ─── Fonction utilitaire pour transformer un journal
const transformJournal = (journal) => {
    const data = journal.toJSON();
    return {
        ...data,
        solde: data.solde,
        valideurs: (data.validationsConfig || []).map(vc => ({
            username: vc.user?.username || null,
            email: vc.user?.email || null,
            ordre: vc.ordre,
            user_id: vc.user_id
        })),
        validationsConfig: undefined
    };
};

// ─── Récupération de tous les journaux
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
                    model: JournalValider,
                    as: 'validationsConfig',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['username', 'email', 'role'],
                            where: { role: 'rh' }
                        }
                    ]
                }
            ]
        });

        const result = journals.map(journal => {
            const data = journal.toJSON();
            return {
                ...data,
                solde: data.solde,
                valideurs: (data.validationsConfig || []).map(vc => ({
                    user_id: vc.user_id,
                    username: vc.user?.username,
                    email: vc.user?.email,
                    ordre: vc.ordre,
                    statut: vc.statut
                })),
                validationsConfig: undefined
            };
        });

        res.send(result);

    } catch (err) {
        console.error("Erreur lors de la récupération des journaux :", err);
        res.status(500).send({ message: "Une erreur est survenue lors de la récupération des journaux." });
    }
};

// ─── Récupération d'un journal par ID
exports.findOne = async (req, res) => {
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
                    model: JournalValider,
                    as: 'validationsConfig',
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
        res.status(500).send({ message: "Erreur lors de la récupération du journal." });
    }
};

// ─── Suppression d'un journal
exports.delete = async (req, res) => {
    const id = req.params.id;
    const t = await db.sequelize.transaction();
    try {
        const journal = await Journal.findByPk(id, { transaction: t });

        if (!journal) {
            await t.rollback();
            return res.status(404).send({ message: "Journal introuvable." });
        }
        
        await Demande.destroy({ where: { journal_id: id }, transaction: t });
        await JournalBudget.destroy({ where: { journal_id: id }, transaction: t });
        await JournalValider.destroy({ where: { journal_id: id }, transaction: t });

        await journal.destroy({ transaction: t });
        
        await t.commit();
        res.status(204).send();
    } catch (err) {
        if (t && !t.finished) {
            await t.rollback();
        }
        console.error("Erreur lors de la suppression du journal :", err);
        res.status(500).send({ message: "Impossible de supprimer le journal." });
    }
};