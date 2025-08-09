
//middleware/verifySignup.js
const db = require("../Models");

const checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    // Vérification du username
    const user = await db.User.findOne({
      where: { username: req.body.username }
    });
    if (user) {
      return res.status(400).send({ message: "Username is already in use!" });
    }

    // Vérification de l'email
    const email = await db.User.findOne({
      where: { email: req.body.email }
    });
    if (email) {
      return res.status(400).send({ message: "Email is already in use!" });
    }

    next();
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

// Si vous utilisez des rôles
const checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let role of req.body.roles) {
      if (!db.ROLES.includes(role)) {
        return res.status(400).send({
          message: `Role ${role} does not exist!`
        });
      }
    }
  }
  next();
};

module.exports = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted
};