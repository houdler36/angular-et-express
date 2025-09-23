const db = require('../Models');
const Budget = db.budget;
const Op = db.Sequelize.Op;

// Créer et sauvegarder un nouveau budget
exports.create = async (req, res) => {
  // Valider la requête
  if (!req.body.code_budget || !req.body.annee_fiscale) {
    res.status(400).send({
      message: "Le code du budget et l'année fiscale ne peuvent pas être vides !"
    });
    return;
  }

  // Créer un objet Budget
  const budget = {
    description: req.body.description || '',
    code_budget: req.body.code_budget,
    annee_fiscale: req.body.annee_fiscale,
    budget_annuel: req.body.budget_annuel || 0,
    reste_budget: req.body.budget_annuel || 0, // CORRIGÉ: "reste_budget" pour correspondre à la base de données
    budget_trimestre_1: req.body.budget_trimestre_1 || 0,
    reste_trimestre_1: req.body.budget_trimestre_1 || 0, // Initialisation du reste du T1
    budget_trimestre_2: req.body.budget_trimestre_2 || 0,
    reste_trimestre_2: req.body.budget_trimestre_2 || 0, // Initialisation du reste du T2
    budget_trimestre_3: req.body.budget_trimestre_3 || 0,
    reste_trimestre_3: req.body.budget_trimestre_3 || 0, // Initialisation du reste du T3
    budget_trimestre_4: req.body.budget_trimestre_4 || 0,
    reste_trimestre_4: req.body.budget_trimestre_4 || 0, // Initialisation du reste du T4
  };

  try {
    // Sauvegarder le budget dans la base de données
    const data = await Budget.create(budget);
    res.status(201).send(data);
  } catch (err) {
    console.error("Erreur lors de la création du budget:", err);
    res.status(500).send({
      message: err.message || "Une erreur est survenue lors de la création du budget."
    });
  }
};

// Récupérer tous les budgets de l'année en cours
exports.findAllCurrentYear = async (req, res) => {
  const currentYear = new Date().getFullYear();

  try {
    const budgets = await Budget.findAll({
      where: { annee_fiscale: currentYear },
      // Spécifier les attributs pour éviter les erreurs de colonnes manquantes
      attributes: [
        'id_budget',
        'description',
        'code_budget',
        'annee_fiscale',
        'budget_annuel',
        'reste_budget', // CORRIGÉ: "reste_budget"
        'budget_trimestre_1',
        'reste_trimestre_1',
        'budget_trimestre_2',
        'reste_trimestre_2',
        'budget_trimestre_3',
        'reste_trimestre_3',
        'budget_trimestre_4',
        'reste_trimestre_4'
      ]
    });
    res.status(200).send(budgets);
  } catch (err) {
    console.error("Erreur lors de la récupération des budgets de l'année en cours:", err);
    res.status(500).send({
      message: err.message || "Une erreur est survenue lors de la récupération des budgets."
    });
  }
};

// Récupérer tous les budgets (pour l'historique)
exports.findAll = async (req, res) => {
  try {
    const budgets = await Budget.findAll({
      // Spécifier les attributs pour éviter les erreurs de colonnes manquantes
      attributes: [
        'id_budget',
        'description',
        'code_budget',
        'annee_fiscale',
        'budget_annuel',
        'reste_budget', // CORRIGÉ: "reste_budget"
        'budget_trimestre_1',
        'reste_trimestre_1',
        'budget_trimestre_2',
        'reste_trimestre_2',
        'budget_trimestre_3',
        'reste_trimestre_3',
        'budget_trimestre_4',
        'reste_trimestre_4'
      ]
    });
    res.status(200).send(budgets);
  } catch (err) {
    console.error("Erreur lors de la récupération de tous les budgets:", err);
    res.status(500).send({
      message: err.message || "Une erreur est survenue lors de la récupération des budgets."
    });
  }
};

// Nouvelle fonction pour trouver un budget par son code
exports.findByCode = (req, res) => {
    const codeBudget = req.query.code; // Récupère le paramètre 'code' de l'URL
    
    Budget.findOne({
        where: { code_budget: codeBudget }
    })
    .then(data => {
        if (data) {
            res.send(data);
        } else {
            res.status(404).send({
                message: `Impossible de trouver un Budget avec le code=${codeBudget}.`
            });
        }
    })
    .catch(err => {
        console.error("Erreur lors de la récupération du budget par code:", err);
        res.status(500).send({
            message: "Erreur lors de la récupération du Budget avec le code=" + codeBudget
        });
    });
};
