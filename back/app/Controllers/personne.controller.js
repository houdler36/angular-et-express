const db = require('../Models');
const Personne = db.personne;
const Op = db.Sequelize.Op;

// Créer et sauvegarder une nouvelle personne
exports.create = async (req, res) => {
  if (!req.body.nom || !req.body.prenom) {
    res.status(400).send({
      message: "Le nom et le prénom ne peuvent pas être vides !"
    });
    return;
  }

  const personne = {
    nom: req.body.nom,
    prenom: req.body.prenom,
    poste: req.body.poste || ''
  };

  try {
    const data = await Personne.create(personne);
    res.status(201).send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Une erreur est survenue lors de la création de la personne."
    });
  }
};

// Récupérer toutes les personnes
exports.findAll = async (req, res) => {
  try {
    const personnes = await Personne.findAll();
    res.status(200).send(personnes);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Une erreur est survenue lors de la récupération des personnes."
    });
  }
};

// Récupérer une personne par ID
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const personne = await Personne.findByPk(id);
    if (personne) {
      res.status(200).send(personne);
    } else {
      res.status(404).send({ message: `Personne non trouvée avec id=${id}` });
    }
  } catch (err) {
    res.status(500).send({ message: "Erreur lors de la récupération de la personne avec id=" + id });
  }
};

// Mettre à jour une personne par ID
exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    const personne = await Personne.findByPk(id);
    if (!personne) {
      return res.status(404).send({ message: `Personne non trouvée avec id=${id}` });
    }

    await personne.update({
      nom: req.body.nom,
      prenom: req.body.prenom,
      poste: req.body.poste
    });

    res.send(personne);
  } catch (err) {
    res.status(500).send({ message: "Erreur lors de la mise à jour de la personne avec id=" + id });
  }
};

// Supprimer une personne par ID
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const personne = await Personne.findByPk(id);
    if (!personne) {
      return res.status(404).send({ message: `Personne non trouvée avec id=${id}` });
    }

    await personne.destroy();
    res.send({ message: "Personne supprimée avec succès !" });
  } catch (err) {
    res.status(500).send({ message: "Erreur lors de la suppression de la personne avec id=" + id });
  }
};
