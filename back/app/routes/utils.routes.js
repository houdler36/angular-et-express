// app/routes/utils.routes.js
console.log("Chargement du routeur d'utilitaires...");
const express = require('express');
const router = express.Router();
const db = require("../Models");
const authJwt = require("../middleware/authJwt");
const budgetController = require("../Controllers/budget.controller");

// Définir les modèles pour les utiliser dans les routes
const Journal = db.journal;
const User = db.user;
const Budget = db.budget;

// Middleware pour vérifier le jeton d'authentification pour toutes les routes de ce routeur
router.use(authJwt.verifyToken);

// Route de test pour vérifier si le routeur fonctionne
router.get("/test", (req, res) => {
    res.status(200).send({ message: "La route de test fonctionne!" });
});

// Route pour obtenir les journaux de l'utilisateur connecté
// Accessible via GET /api/utils/journals
router.get("/journals", async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).send({ message: "Utilisateur non authentifié." });
        }

        const user = await User.findByPk(userId, {
            include: [{
                model: Journal,
                as: 'journals'
            }]
        });

        if (!user || !user.journals || user.journals.length === 0) {
            return res.status(404).send({ message: "Aucun journal trouvé pour cet utilisateur." });
        }

        res.status(200).send(user.journals);
    } catch (error) {
        console.error("Erreur lors de la récupération des journaux de l'utilisateur:", error);
        res.status(500).send({ message: "Erreur serveur." });
    }
});

// Route pour obtenir une liste d'utilisateurs avec le rôle 'daf' ou 'caissier'
// Accessible via GET /api/utils/responsibles
router.get("/responsibles", async (req, res) => {
    try {
        const users = await User.findAll({
            where: { role: ['daf', 'caissier'] },
            attributes: ['id', 'username']
        });
        res.status(200).send(users);
    } catch (error) {
        console.error("Erreur lors de la récupération des responsables:", error);
        res.status(500).send({ message: "Erreur serveur." });
    }
});

// Route pour obtenir les informations budgétaires par code
// Accessible via GET /api/utils/budgets?code=...
router.get("/budgets", async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.status(400).send({ message: "Le code budgétaire est requis." });
        }
        const budget = await Budget.findOne({ where: { code_budget: code } });
        if (!budget) {
            return res.status(404).send({ message: "Budget non trouvé." });
        }
        res.status(200).send(budget);
    } catch (error) {
        console.error("Erreur lors de la récupération du budget:", error);
        res.status(500).send({ message: "Erreur serveur." });
    }
});

// NOUVELLE ROUTE : Obtenir tous les budgets liés à un journal spécifique
// Accessible via GET /api/utils/journals/:journalId/budgets
router.get("/journals/:journalId/budgets", async (req, res) => {
    try {
        const { journalId } = req.params;
        const journal = await Journal.findByPk(journalId, {
            include: [{
                model: Budget,
                through: { attributes: [] }
            }]
        });

        if (!journal) {
            return res.status(404).send({ message: "Journal non trouvé." });
        }

        res.status(200).send(journal.budgets);
    } catch (error) {
        console.error("Erreur lors de la récupération des budgets pour le journal:", error);
        res.status(500).send({ message: "Erreur serveur." });
    }
});

// Nouvelle route pour obtenir les budgets de l'année en cours
// Accessible via GET /api/utils/budgets/currentYear
router.get("/budgets/currentYear", budgetController.findAllCurrentYear);

module.exports = router;
