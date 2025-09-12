const express = require('express');
const router = express.Router();
const demandeController = require('../Controllers/demande.controller');
const { verifyToken } = require('../middleware/authJwt');

// ─── Routes spécifiques ─────────────────────────────────────

// Récupérer les demandes à valider pour l'utilisateur connecté (RH-only)
router.get('/avalider', verifyToken, demandeController.getDemandesAValider);

// Récupérer les demandes en attente chez un autre validateur (RH-only)
router.get('/enattenteautres', verifyToken, demandeController.getDemandesEnAttenteAutres);

// Récupérer les demandes finalisées
router.get('/finalisees', verifyToken, demandeController.getDemandesFinalisees);

// Statistiques générales des demandes
router.get('/stats/general', verifyToken, demandeController.getDemandeStats);

// Récupérer les demandes de plus de 70000 à valider par le DAF
router.get('/daf-a-valider', verifyToken, demandeController.getDemandesDAFAValider);

router.get('/pj-non-fournies', verifyToken, demandeController.getDemandesPJNonFournies);

// Rapports par journal ID
router.get('/rapport/:journalId', demandeController.getRapportDemandesApprouvees);

// ✅ NOUVELLE ROUTE POUR LE RAPPORT PAR NOM DE PROJET
router.get('/rapport-projet/:nomProjet', verifyToken, demandeController.getDemandesByProjectName);

// ✅ NOUVELLE ROUTE POUR RÉCUPÉRER LES INFORMATIONS DU BUDGET PAR CODE
router.get('/budgets/info/:codeBudget', verifyToken, demandeController.getBudgetInfoByCode);
// Récupérer tous les projets avec leurs budgets
router.get('/projets-budgets', verifyToken, demandeController.getProjetsWithBudgets);


// ─── Routes par ID ────────────────────────────────────────

// Création d'une demande
router.post('/', verifyToken, demandeController.create);

// Récupération d'une demande par ID
router.get('/:id', verifyToken, demandeController.findOne);

// Mise à jour d'une demande
router.put('/:id', verifyToken, demandeController.update);

// Suppression d'une demandea
router.delete('/:id', verifyToken, demandeController.delete);

// Validation et refus d'une demande (RH-only)
router.put('/:id/valider', verifyToken, demandeController.validerDemande);
router.put('/:id/refuser', verifyToken, demandeController.refuserDemande);

// Mise à jour du pj_status d'un DED
router.put('/:id/pj_status', verifyToken, demandeController.updatePjStatus);

// ─── Routes générales ────────────────────────────────────

// J'ai corrigé cette ligne pour qu'elle renvoie toutes les demandes de l'utilisateur.
router.get('/', verifyToken, demandeController.findAllUserDemandes);


module.exports = router;