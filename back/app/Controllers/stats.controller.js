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

// Récupère les activités récentes pour le tableau de bord
exports.getRecentActivities = async (req, res) => {
  try {
    // Récupérer les dernières activités de chaque type (basé sur l'ID le plus élevé)
    const [recentUsers, recentPersonnes, recentJournals, recentBudgets, recentDemandes] = await Promise.all([
      User.findAll({
        limit: 3,
        order: [['id', 'DESC']],
        attributes: ['id', 'username', 'role']
      }),
      Personne.findAll({
        limit: 3,
        order: [['id', 'DESC']],
        attributes: ['id', 'nom', 'prenom', 'poste']
      }),
      Journal.findAll({
        limit: 3,
        order: [['id_journal', 'DESC']],
        attributes: ['id_journal', 'nom_journal', 'nom_projet']
      }),
      Budget.findAll({
        limit: 3,
        order: [['id_budget', 'DESC']],
        attributes: ['id_budget', 'description', 'code_budget']
      }),
      Demande.findAll({
        limit: 3,
        order: [['id', 'DESC']],
        attributes: ['id', 'type', 'status', 'montant_total']
      })
    ]);

    // Transformer les données en format d'activités
    const activities = [];

    // Utilisateurs récents
    recentUsers.forEach(user => {
      activities.push({
        type: 'success',
        icon: 'fas fa-user-plus',
        text: `Nouvel utilisateur créé: ${user.username} (${user.role})`,
        time: 'Récemment'
      });
    });

    // Personnes récentes
    recentPersonnes.forEach(personne => {
      activities.push({
        type: 'info',
        icon: 'fas fa-user-tie',
        text: `${personne.nom} ${personne.prenom || ''} ajouté(e) en tant que ${personne.poste || 'employé'}`,
        time: 'Récemment'
      });
    });

    // Journaux récents
    recentJournals.forEach(journal => {
      activities.push({
        type: 'warning',
        icon: 'fas fa-book',
        text: `Nouvelle entrée dans le journal: ${journal.nom_journal} (${journal.nom_projet})`,
        time: 'Récemment'
      });
    });

    // Budgets récents
    recentBudgets.forEach(budget => {
      activities.push({
        type: 'info',
        icon: 'fas fa-wallet',
        text: `Budget ajouté: ${budget.description} (${budget.code_budget})`,
        time: 'Récemment'
      });
    });

    // Demandes récentes
    recentDemandes.forEach(demande => {
      activities.push({
        type: 'primary',
        icon: 'fas fa-file-alt',
        text: `Nouvelle demande ${demande.type}: ${demande.status} (${demande.montant_total}€)`,
        time: 'Récemment'
      });
    });

    // Trier par ID décroissant et limiter à 10 activités
    activities.sort((a, b) => b.id - a.id);
    const limitedActivities = activities.slice(0, 10);

    res.status(200).send(limitedActivities);
  } catch (err) {
    console.error("Erreur lors de la récupération des activités récentes :", err);
    res.status(500).send({
      message: err.message || "Une erreur est survenue lors de la récupération des activités récentes."
    });
  }
};
