const express = require('express');
const router = express.Router();
const db = require("../Models");
const Personne = db.personne;
const authJwt = require("../middleware/authJwt");

// Middleware de vérification du token JWT pour toutes les routes
router.use(authJwt.verifyToken);

// Route GET pour récupérer toutes les personnes
router.get("/", async (req, res) => {
    try {
        const personnes = await Personne.findAll({
            attributes: ['id', 'nom', 'poste']
        });
        res.status(200).send(personnes);
    } catch (error) {
        console.error("Erreur lors de la récupération des personnes:", error);
        res.status(500).send({ message: "Erreur serveur lors de la récupération des personnes." });
    }
});

// Route POST pour ajouter une nouvelle personne (facultatif, mais utile pour la gestion)
router.post("/", async (req, res) => {
    try {
        const newPersonne = await Personne.create(req.body);
        res.status(201).send(newPersonne);
    } catch (error) {
        console.error("Erreur lors de la création d'une personne:", error);
        res.status(500).send({ message: "Erreur serveur lors de la création d'une personne." });
    }
});

module.exports = router;