const express = require("express");
const router = express.Router();
const { authJwt } = require("../middleware");
const controller = require("../Controllers/user.controller");

// Middleware pour les headers CORS
router.use(function(req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

// Routes test publiques / protégées
router.get("/test/all", controller.allAccess);
router.get("/test/user", [authJwt.verifyToken], controller.userBoard);
router.get("/test/admin", [authJwt.verifyToken, authJwt.isAdmin], controller.adminBoard);
router.get(
  "/test/approver-admin-rh-daf-caissier",
  [authJwt.verifyToken, authJwt.isApproverOrAdminOrRhOrDafOrCaissier],
  controller.isApproverOrAdminOrRhOrDafOrCaissierBoard
);

// Route pour récupérer tous les utilisateurs (accessible uniquement admin)
router.get(
  "/admin/users",
  [authJwt.verifyToken, authJwt.isAdmin],
  controller.getAllUsers
);

// Route pour récupérer uniquement les utilisateurs RH (accessible uniquement admin)
router.get(
  "/admin/rh-users",
  [authJwt.verifyToken, authJwt.isAdmin],
  controller.getAllRhUsers
);

// Route pour récupérer un utilisateur par ID (admin uniquement)
router.get(
  "/admin/users/:id",
  [authJwt.verifyToken, authJwt.isAdmin],
  controller.getUserById
);

// Route pour créer un utilisateur admin
router.post(
  "/admin/create-user",
  [authJwt.verifyToken, authJwt.isAdmin],
  controller.createAdminUser
);

// Route pour récupérer tous les journaux (protégé, pas forcément admin)
router.get(
  "/journals",
  [authJwt.verifyToken],
  controller.getJournals
);

module.exports = router;
