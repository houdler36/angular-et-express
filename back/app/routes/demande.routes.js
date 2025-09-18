const express = require('express');
const router = express.Router();

// ✅ Unifiez les importations ici.
const demandeController = require('../Controllers/demande.controller');
const { verifyToken } = require('../middleware/authJwt');

// ─── Routes générales (Mises à jour) ────────────────────────────

// Récupérer toutes les demandes pour l'utilisateur connecté
// (Cette route remplace la route en double à la fin du fichier)
router.get('/', verifyToken, demandeController.findAllUserDemandes);

// Création d'une demande
router.post('/', verifyToken, demandeController.create);


// ─── Routes spécifiques ─────────────────────────────────────

// Rapports par journal ID
router.get('/rapport/:journalId', verifyToken, demandeController.getRapportDemandesApprouvees);

// Rapport par nom de projet ET code budget
// ✅ Utilisez le bon nom de variable (demandeController)
// ✅ Utilisez la bonne variable pour le middleware (verifyToken)
router.get("/rapports/demandes-filtered", verifyToken, demandeController.getRapportByProjetAndBudget);

// Récupérer les demandes à valider pour l'utilisateur connecté
router.get('/avalider', verifyToken, demandeController.getDemandesAValider);

// Récupérer les demandes en attente chez un autre validateur
router.get('/enattenteautres', verifyToken, demandeController.getDemandesEnAttenteAutres);

// Récupérer les demandes finalisées
router.get('/finalisees', verifyToken, demandeController.getDemandesFinalisees);

// Statistiques générales des demandes
router.get('/stats/general', verifyToken, demandeController.getDemandeStats);

// Récupérer les demandes DAF à valider
router.get('/daf-a-valider', verifyToken, demandeController.getDemandesDAFAValider);

// Demandes avec PJ non fournies
router.get('/pj-non-fournies', verifyToken, demandeController.getDemandesPJNonFournies);

// Rapport par nom de projet
router.get('/rapport-projet/:nomProjet', verifyToken, demandeController.getDemandesByProjectName);

// Récupérer les informations du budget par code
router.get('/budgets/info/:codeBudget', verifyToken, demandeController.getBudgetInfoByCode);

// Récupérer tous les projets avec leurs budgets
router.get('/projets-budgets', verifyToken, demandeController.getProjetsWithBudgets);


// ─── Routes par ID ────────────────────────────────────────

// Récupération d'une demande par ID
router.get('/:id', verifyToken, demandeController.findOne);

// Mise à jour d'une demande
router.put('/:id', verifyToken, demandeController.update);

// Suppression d'une demande
router.delete('/:id', verifyToken, demandeController.delete);

// Validation et refus d'une demande
router.put('/:id/valider', verifyToken, demandeController.validerDemande);
router.put('/:id/refuser', verifyToken, demandeController.refuserDemande);

// Mise à jour du pj_status d'un DED
router.put('/:id/pj_status', verifyToken, demandeController.updatePjStatus);

// Mise à jour du statut d'une demande
router.patch("/:id/status", verifyToken, demandeController.updateStatus);

module.exports = router;