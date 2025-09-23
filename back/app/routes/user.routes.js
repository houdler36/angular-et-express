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

// Routes utilisateurs
router.get("/admin/users", [authJwt.verifyToken, authJwt.isAdmin], controller.getAllUsers);
router.get("/admin/rh-users", [authJwt.verifyToken, authJwt.isAdmin], controller.getAllRhUsers);
router.get("/admin/users/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.getUserById);
router.post("/admin/create-user", [authJwt.verifyToken, authJwt.isAdmin], controller.createAdminUser);

// **Nouvelles routes pour mise à jour et suppression**
router.put("/admin/users/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.updateUser);
router.delete("/admin/users/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.deleteUser);

// Route pour récupérer tous les journaux (protégé, pas forcément admin)
router.get("/journals", [authJwt.verifyToken], controller.getJournals);
// Profil connecté
// Définir un remplaçant RH
router.put("/me/delegue", [authJwt.verifyToken], controller.setDelegue);

router.get("/me", [authJwt.verifyToken], controller.getCurrentUser);
router.put("/me", [authJwt.verifyToken], controller.updateCurrentUser);

// **NOUVELLE ROUTE POUR LE CHANGEMENT DE MOT DE PASSE DU PROFIL CONNECTÉ**
// La route put "/me" est plus appropriée car elle modifie le profil de l'utilisateur connecté
// Le backend doit pouvoir gérer le champ "password" dans la requête PUT de cette route
router.put("/me/change-password", [authJwt.verifyToken], controller.changePassword);


module.exports = router;