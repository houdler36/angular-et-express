// Fichier : C:\Users\WINDOWS 10\Desktop\Houlder\back\app\routes\user.routes.js

const express = require("express");
const router = express.Router(); // Créez un routeur Express
const { authJwt } = require("../middleware");
const controller = require("../Controllers/user.controller");

router.use(function(req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

// Les routes ci-dessous sont maintenant relatives à '/api/users'
// L'URL finale sera donc /api/users/test/all
router.get("/test/all", controller.allAccess);

// L'URL finale sera /api/users/test/user
router.get("/test/user", [authJwt.verifyToken], controller.userBoard);

// L'URL finale sera /api/users/test/admin
router.get(
  "/test/admin",
  [authJwt.verifyToken, authJwt.isAdmin],
  controller.adminBoard
);

// L'URL finale sera /api/users/test/approver-admin-rh-daf-caissier
router.get(
  "/test/approver-admin-rh-daf-caissier",
  [authJwt.verifyToken, authJwt.isApproverOrAdminOrRhOrDafOrCaissier],
  controller.isApproverOrAdminOrRhOrDafOrCaissierBoard
);

// Route pour créer un utilisateur (l'URL finale sera /api/users/admin/create-user)
router.post(
  "/admin/create-user",
  [authJwt.verifyToken, authJwt.isAdmin],
  controller.createAdminUser
);

// Route pour récupérer tous les utilisateurs (l'URL finale sera /api/users/admin/users)
router.get(
  "/admin/users",
  [authJwt.verifyToken, authJwt.isAdmin],
  controller.getAllUsers
);

// Route pour récupérer un utilisateur par son ID (l'URL finale sera /api/users/admin/users/:id)
router.get(
  "/admin/users/:id",
  [authJwt.verifyToken, authJwt.isAdmin],
  controller.getUserById
);

// Route pour récupérer tous les journaux (l'URL finale sera /api/users/journals)
router.get(
  "/journals",
  [authJwt.verifyToken],
  controller.getJournals
);

module.exports = router;
