// app/Controllers/stats.controller.js

const db = require("../Models");
const User = db.user;       // CORRIGÉ : utilise db.user au lieu de db.users
const Personne = db.personne;   // CORRIGÉ : utilise db.personne au lieu de db.personnes
const Journal = db.journal;
const Budget = db.budget;
const Demande = db.demande;     // CORRIGÉ : utilise db.demande au lieu de db.demandes

// Récupère les statistiques pour le tableau de bord
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      userCount,
      personneCount,
      journalCount,
      budgetCount,
      demandeCount
    ] = await Promise.all([
      User.count(),
      Personne.count(),
      Journal.count(),
      Budget.count(),
      Demande.count()
    ]);

    res.status(200).send({
      userCount,
      personneCount,
      journalCount,
      budgetCount,
      demandeCount
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des statistiques :", err);
    res.status(500).send({
      message: err.message || "Une erreur est survenue lors de la récupération des statistiques."
    });
  }
};