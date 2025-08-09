const db = require('../Models');
const Journal = db.journal;
const Budget = db.budget;

// Créer et sauvegarder un nouveau journal avec ses budgets
exports.create = async (req, res) => {
  // Valider la requête
  if (!req.body.nom_journal || !req.body.nom_projet) {
    res.status(400).send({
      message: "Le nom du journal et le nom du projet ne peuvent pas être vides !"
    });
    return;
  }

  const { nom_journal, nom_projet, budgetIds } = req.body;

  // --- LOG 1 : Vérifie les données reçues du frontend ---
  console.log('--- Début de la création du journal ---');
  console.log('Données reçues du frontend (nom_journal, nom_projet, budgetIds):', { nom_journal, nom_projet, budgetIds });

  try {
    // Créer le journal
    const newJournal = await Journal.create({ nom_journal, nom_projet });
    console.log('Journal créé avec succès. ID du journal:', newJournal.id_journal);

    // Associer les budgets, si des IDs sont fournis
    if (budgetIds && budgetIds.length > 0) {
      // --- LOG 2 : Vérifie les IDs de budgets que nous allons rechercher ---
      console.log('Des budgetIds ont été fournis. Recherche des budgets avec les IDs:', budgetIds);

      const budgets = await Budget.findAll({
        where: { id_budget: budgetIds }
      });

      // --- LOG 3 : Vérifie les budgets trouvés dans la base de données ---
      console.log('Budgets trouvés dans la base de données:', budgets.map(b => b.id_budget)); // Affiche seulement les IDs pour la clarté

      if (budgets.length > 0) {
        await newJournal.setBudgets(budgets);
        console.log('Association des budgets au journal réussie.');
      } else {
        console.log('Aucun budget correspondant trouvé pour les IDs fournis. Aucune association effectuée.');
      }
    } else {
      console.log('Aucun budgetId fourni. Aucune association de budget effectuée.');
    }

    // Récupérer le journal avec ses budgets associés pour la réponse
    const journalWithBudgets = await Journal.findByPk(newJournal.id_journal, {
      include: [{
        model: Budget,
        as: 'budgets',
        through: { attributes: [] } // Exclure les colonnes de la table de liaison
      }]
    });
    console.log('Journal créé et récupéré avec budgets associés pour la réponse:', journalWithBudgets.toJSON()); // Affiche l'objet complet

    res.status(201).send(journalWithBudgets);
    console.log('--- Fin de la création du journal (succès) ---');
  } catch (err) {
    console.error('--- Erreur lors de la création du journal ---');
    console.error('Message d\'erreur:', err.message);
    res.status(500).send({
      message: err.message || "Une erreur est survenue lors de la création du journal."
    });
    console.error('--- Fin de la création du journal (échec) ---');
  }
};

// Récupérer tous les journaux avec leurs budgets associés
exports.findAll = async (req, res) => {
  try {
    const journals = await Journal.findAll({
      include: [{
        model: Budget,
        as: 'budgets',
        through: { attributes: [] }
      }]
    });
    res.status(200).send(journals);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Une erreur est survenue lors de la récupération des journaux."
    });
  }
};
