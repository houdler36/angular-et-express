const express = require('express');
const router = express.Router();
const db = require("../Models");
const Personne = db.personne;
const authJwt = require("../middleware/authJwt");

// Middleware de vérification du token JWT pour toutes les routes
router.use(authJwt.verifyToken);

// GET : Récupérer toutes les personnes
router.get("/", async (req, res) => {
    try {
        const personnes = await Personne.findAll({
            attributes: ['id', 'nom', 'prenom', 'poste']
        });
        res.status(200).send(personnes);
    } catch (error) {
        console.error("Erreur lors de la récupération des personnes:", error);
        res.status(500).send({ message: "Erreur serveur lors de la récupération des personnes." });
    }
});

// GET : Récupérer une personne par ID
router.get("/:id", async (req, res) => {
    try {
        const personne = await Personne.findByPk(req.params.id);
        if (personne) res.status(200).send(personne);
        else res.status(404).send({ message: "Personne non trouvée." });
    } catch (error) {
        res.status(500).send({ message: "Erreur serveur lors de la récupération." });
    }
});

// POST : Ajouter une personne
router.post("/", async (req, res) => {
    try {
        const newPersonne = await Personne.create(req.body);
        res.status(201).send(newPersonne);
    } catch (error) {
        console.error("Erreur lors de la création d'une personne:", error);
        res.status(500).send({ message: "Erreur serveur lors de la création d'une personne." });
    }
});

// PUT : Mettre à jour une personne par ID
router.put("/:id", async (req, res) => {
    try {
        const updated = await Personne.update(req.body, {
            where: { id: req.params.id }
        });
        if (updated[0] === 1) res.status(200).send({ message: "Personne mise à jour avec succès." });
        else res.status(404).send({ message: "Personne non trouvée." });
    } catch (error) {
        res.status(500).send({ message: "Erreur serveur lors de la mise à jour." });
    }
});

// DELETE : Supprimer une personne par ID
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Personne.destroy({ where: { id: req.params.id } });
        if (deleted) res.status(200).send({ message: "Personne supprimée avec succès." });
        else res.status(404).send({ message: "Personne non trouvée." });
    } catch (error) {
        res.status(500).send({ message: "Erreur serveur lors de la suppression." });
    }
});

module.exports = router;
