const db = require('../Models');
const Journal = db.journal;
const Budget = db.budget;
const User = db.user;

// Créer un journal avec budgets et valideurs
exports.create = async (req, res) => {
  const { nom_journal, nom_projet, budgetIds, valideurs } = req.body;

  if (!nom_journal || !nom_projet) {
    return res.status(400).send({ message: "Nom du journal et nom du projet requis." });
  }

  try {
    const newJournal = await Journal.create({ nom_journal, nom_projet });

    if (budgetIds && budgetIds.length > 0) {
      const budgets = await Budget.findAll({ where: { id_budget: budgetIds } });
      if (budgets.length > 0) {
        await newJournal.setBudgets(budgets);
      }
    }

    if (valideurs && valideurs.length > 0) {
      for (const v of valideurs) {
        await db.journalValider.create({
          journal_id: newJournal.id_journal,
          user_id: v.user_id,
          ordre: v.ordre || 1,
          statut: 'en attente',
          date_validation: null,
          commentaire: null,
        });
      }
    }

    // Récupérer le journal complet avec budgets ET valideurs
    const journalFull = await Journal.findByPk(newJournal.id_journal, {
      include: [
        {
          model: Budget,
          as: 'budgets',
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'valideurs',
          through: {
            attributes: ['ordre', 'statut', 'date_validation', 'commentaire']
          }
        }
      ]
    });

    res.status(201).send(journalFull);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || "Erreur création journal." });
  }
};

// Récupérer tous les journaux avec budgets et valideurs
exports.findAll = async (req, res) => {
  try {
    const journals = await Journal.findAll({
      include: [
        {
          model: Budget,
          as: 'budgets',
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'valideurs',
          through: {
            attributes: ['ordre', 'statut', 'date_validation', 'commentaire']
          }
        }
      ]
    });
    res.status(200).send(journals);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || "Erreur récupération journaux." });
  }
};
