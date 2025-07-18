// Version corrigée du contrôleur
module.exports = {
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll({
        attributes: ['id', 'username', 'email', 'role']
      });
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getUserById: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id, {
        attributes: ['id', 'username', 'email', 'role']
      });
      if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};