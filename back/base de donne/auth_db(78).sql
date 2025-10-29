-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mar. 28 oct. 2025 à 08:29
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `auth_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `budget`
--

CREATE TABLE `budget` (
  `id_budget` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `code_budget` varchar(255) NOT NULL,
  `annee_fiscale` int(11) NOT NULL,
  `budget_annuel` decimal(15,2) DEFAULT 0.00,
  `reste_budget` decimal(15,2) DEFAULT 0.00,
  `budget_trimestre_1` decimal(15,2) DEFAULT 0.00,
  `budget_trimestre_2` decimal(15,2) DEFAULT 0.00,
  `budget_trimestre_3` decimal(15,2) DEFAULT 0.00,
  `budget_trimestre_4` decimal(15,2) DEFAULT 0.00,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `reste_trimestre_1` decimal(15,2) DEFAULT 0.00,
  `reste_trimestre_2` decimal(15,2) DEFAULT 0.00,
  `reste_trimestre_3` decimal(15,2) DEFAULT 0.00,
  `reste_trimestre_4` decimal(15,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `budget`
--

INSERT INTO `budget` (`id_budget`, `description`, `code_budget`, `annee_fiscale`, `budget_annuel`, `reste_budget`, `budget_trimestre_1`, `budget_trimestre_2`, `budget_trimestre_3`, `budget_trimestre_4`, `createdAt`, `updatedAt`, `reste_trimestre_1`, `reste_trimestre_2`, `reste_trimestre_3`, `reste_trimestre_4`) VALUES
(1, 'budget carburant', '001', 2025, 4000000.00, 4000000.00, 1000000.00, 1000000.00, 1000000.00, 1000000.00, '2025-10-20 06:27:31', '2025-10-20 06:27:31', 1000000.00, 1000000.00, 1000000.00, 1000000.00),
(2, 'budget Entrentien', '002', 2025, 8000000.00, 8000000.00, 2000000.00, 2000000.00, 2000000.00, 2000000.00, '2025-10-20 06:29:25', '2025-10-20 06:29:25', 2000000.00, 2000000.00, 2000000.00, 2000000.00),
(3, 'budget_Informatique', '003', 2025, 12000000.00, 12000000.00, 3000000.00, 3000000.00, 3000000.00, 3000000.00, '2025-10-20 06:30:41', '2025-10-20 06:30:41', 3000000.00, 3000000.00, 3000000.00, 3000000.00),
(4, 'budget_materiel ', '004', 2025, 800000.00, 760000.00, 200000.00, 200000.00, 200000.00, 160000.00, '2025-10-20 06:31:53', '2025-10-20 06:31:53', 200000.00, 200000.00, 200000.00, 160000.00);

-- --------------------------------------------------------

--
-- Structure de la table `demandes`
--

CREATE TABLE `demandes` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL COMMENT 'ID de l''utilisateur qui crée la demande',
  `type` enum('DED','Recette','ERD') NOT NULL DEFAULT 'DED' COMMENT 'Type de la demande (DED, Recette ou ERD)',
  `journal_id` int(11) DEFAULT NULL COMMENT 'ID du journal associé à la demande, clé étrangère vers la table `journal`',
  `date` date NOT NULL COMMENT 'Date de la demande',
  `expected_justification_date` date DEFAULT NULL COMMENT 'Date attendue pour la justification',
  `pj_status` enum('oui','pas encore') DEFAULT 'pas encore' COMMENT 'Statut de la pièce jointe',
  `resp_pj_id` int(11) DEFAULT NULL COMMENT 'ID du responsable de la pièce jointe, clé étrangère vers la table `users`',
  `status` varchar(255) DEFAULT 'en attente' COMMENT 'Statut général de la demande',
  `montant_total` decimal(15,2) DEFAULT NULL,
  `description` text DEFAULT NULL COMMENT 'Description de la demande',
  `currentValidatorId` int(11) DEFAULT NULL,
  `numero_approuve_journal` int(11) DEFAULT NULL COMMENT 'Numéro séquentiel pour les demandes approuvées, par journal',
  `date_approuvee` date DEFAULT NULL,
  `soldeProgressif` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `demandes`
--

INSERT INTO `demandes` (`id`, `userId`, `type`, `journal_id`, `date`, `expected_justification_date`, `pj_status`, `resp_pj_id`, `status`, `montant_total`, `description`, `currentValidatorId`, `numero_approuve_journal`, `date_approuvee`, `soldeProgressif`) VALUES
(1, 44, 'DED', 3, '2025-10-20', '2025-10-28', 'oui', 2, 'approuvée', 40000.00, 'entretien voiture', NULL, 1, '2025-10-21', 15960000.00),
(2, 44, 'Recette', 3, '2025-10-20', NULL, 'oui', 1, 'approuvée', 700000.00, 'don pour la population', NULL, 2, '2025-10-21', 16700000.00),
(3, 44, 'DED', 4, '2025-10-20', '2025-10-22', 'pas encore', 1, 'en attente', 400000.00, 'mission pour la formantion', NULL, NULL, NULL, NULL),
(4, 44, 'ERD', 3, '2025-10-22', NULL, 'oui', 2, 'approuvée', -10000.00, 'entretien voiture', NULL, 3, '2025-10-22', 15990000.00);

--
-- Déclencheurs `demandes`
--
DELIMITER $$
CREATE TRIGGER `trg_demande_before_update` BEFORE UPDATE ON `demandes` FOR EACH ROW BEGIN
    DECLARE next_num INT;
    DECLARE currentSolde DECIMAL(10,2);

    -- Logique pour la mise à jour du numéro séquentiel et du solde progressif
    IF NEW.status = 'approuvée' AND OLD.status <> 'approuvée' THEN
        -- Définit la date d'approbation à la date actuelle
        SET NEW.date_approuvee = CURDATE();

        -- Gestion du numéro séquentiel par journal
        IF NEW.journal_id IS NOT NULL THEN
            -- Insère ou met à jour la séquence pour ce journal
            INSERT INTO journal_sequence (journal_id, last_num)
            VALUES (NEW.journal_id, 1)
            ON DUPLICATE KEY UPDATE last_num = last_num + 1;

            -- Récupère le dernier numéro utilisé
            SELECT last_num INTO next_num
            FROM journal_sequence
            WHERE journal_id = NEW.journal_id;

            -- Affecte le numéro séquentiel
            SET NEW.numero_approuve_journal = next_num;
        END IF;

        -- Met à jour le solde progressif
        SELECT solde INTO currentSolde
        FROM journal
        WHERE id_journal = NEW.journal_id;

        IF NEW.type = 'DED' THEN
            SET NEW.soldeProgressif = currentSolde - NEW.montant_total;
        ELSEIF NEW.type = 'Recette' OR NEW.type = 'ERD' THEN
            SET NEW.soldeProgressif = currentSolde + NEW.montant_total;
        ELSE
            SET NEW.soldeProgressif = currentSolde;
        END IF;

    -- Ne fait rien si la demande est rejetée, le solde progressif ne change pas.
    ELSEIF NEW.status = 'rejetée' AND OLD.status <> 'rejetée' THEN
        SET NEW.soldeProgressif = OLD.soldeProgressif;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_update_budget_after_validation` AFTER UPDATE ON `demandes` FOR EACH ROW BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_montant DECIMAL(15,2);
    DECLARE v_budget_id INT;

    -- Curseur pour récupérer les détails de la demande
    DECLARE cur CURSOR FOR 
        SELECT amount, budget_id 
        FROM demande_details 
        WHERE demande_id = NEW.id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    -- Le déclencheur s'active uniquement si la demande est approuvée pour la première fois
    IF NEW.status = 'approuvée' AND OLD.status <> 'approuvée' THEN

        OPEN cur;

        read_loop: LOOP
            FETCH cur INTO v_montant, v_budget_id;
            IF done THEN
                LEAVE read_loop;
            END IF;

            -- Mise à jour des budgets restants
            IF v_budget_id IS NOT NULL THEN
                UPDATE budget
                SET 
                    -- Mise à jour trimestrielle
                    reste_trimestre_1 = CASE 
                        WHEN MONTH(NEW.date) BETWEEN 1 AND 3 THEN
                            CASE WHEN NEW.type = 'DED' THEN GREATEST(reste_trimestre_1 - v_montant, 0) ELSE reste_trimestre_1 + v_montant END
                        ELSE reste_trimestre_1 
                    END,
                    reste_trimestre_2 = CASE 
                        WHEN MONTH(NEW.date) BETWEEN 4 AND 6 THEN
                            CASE WHEN NEW.type = 'DED' THEN GREATEST(reste_trimestre_2 - v_montant, 0) ELSE reste_trimestre_2 + v_montant END
                        ELSE reste_trimestre_2 
                    END,
                    reste_trimestre_3 = CASE 
                        WHEN MONTH(NEW.date) BETWEEN 7 AND 9 THEN
                            CASE WHEN NEW.type = 'DED' THEN GREATEST(reste_trimestre_3 - v_montant, 0) ELSE reste_trimestre_3 + v_montant END
                        ELSE reste_trimestre_3 
                    END,
                    reste_trimestre_4 = CASE 
                        WHEN MONTH(NEW.date) BETWEEN 10 AND 12 THEN
                            CASE WHEN NEW.type = 'DED' THEN GREATEST(reste_trimestre_4 - v_montant, 0) ELSE reste_trimestre_4 + v_montant END
                        ELSE reste_trimestre_4 
                    END,
                    -- Mise à jour annuelle
                    reste_budget = CASE 
                        WHEN NEW.type = 'DED' THEN GREATEST(reste_budget - v_montant, 0) 
                        ELSE reste_budget + v_montant 
                    END
                WHERE id_budget = v_budget_id; 
            END IF;

        END LOOP;

        CLOSE cur;

    END IF;

END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_update_budget_trimestre_after_validation` AFTER UPDATE ON `demandes` FOR EACH ROW BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_montant DECIMAL(15,2);
    DECLARE v_budget_id INT;

    -- Curseur pour récupérer les détails de la demande
    DECLARE cur CURSOR FOR 
        SELECT amount, budget_id 
        FROM demande_details 
        WHERE demande_id = NEW.id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    -- Ne rien faire si la demande n'est pas approuvée
    IF NEW.status = 'approuvée' AND OLD.status <> 'approuvée' THEN

        OPEN cur;

        read_loop: LOOP
            FETCH cur INTO v_montant, v_budget_id;
            IF done THEN
                LEAVE read_loop;
            END IF;

            -- Mise à jour du budget seulement si budget_id existe
            IF v_budget_id IS NOT NULL THEN
                UPDATE budget
                SET 
                    budget_trimestre_1 = CASE WHEN MONTH(NEW.date) BETWEEN 1 AND 3 THEN GREATEST(budget_trimestre_1 - v_montant, 0) ELSE budget_trimestre_1 END,
                    budget_trimestre_2 = CASE WHEN MONTH(NEW.date) BETWEEN 4 AND 6 THEN GREATEST(budget_trimestre_2 - v_montant, 0) ELSE budget_trimestre_2 END,
                    budget_trimestre_3 = CASE WHEN MONTH(NEW.date) BETWEEN 7 AND 9 THEN GREATEST(budget_trimestre_3 - v_montant, 0) ELSE budget_trimestre_3 END,
                    budget_trimestre_4 = CASE WHEN MONTH(NEW.date) BETWEEN 10 AND 12 THEN GREATEST(budget_trimestre_4 - v_montant, 0) ELSE budget_trimestre_4 END
                WHERE id_budget = v_budget_id;  -- <- Vérifie le nom exact de la colonne PK de ta table budget
            END IF;

        END LOOP;

        CLOSE cur;

    END IF;

END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `demande_details`
--

CREATE TABLE `demande_details` (
  `id` int(11) NOT NULL,
  `demande_id` int(11) NOT NULL COMMENT 'ID de la demande parente, clé étrangère vers la table `demandes`',
  `nature` enum('appro','charge','produits','autre') NOT NULL COMMENT 'Nature du détail (appro, charge, etc.)',
  `libelle` varchar(255) NOT NULL COMMENT 'Libellé du détail',
  `beneficiaire` varchar(255) NOT NULL COMMENT 'Nom du bénéficiaire',
  `amount` decimal(15,2) NOT NULL,
  `nif_exists` enum('oui','non') NOT NULL DEFAULT 'non' COMMENT 'Indique si le NIF du bénéficiaire existe',
  `nif` varchar(255) DEFAULT NULL,
  `stat` varchar(255) DEFAULT NULL,
  `numero_compte` varchar(255) DEFAULT NULL COMMENT 'Numéro de compte',
  `budget_id` int(11) DEFAULT NULL COMMENT 'ID budgétaire, clé étrangère vers la table `budget`',
  `status_detail` varchar(255) DEFAULT 'en attente' COMMENT 'Statut du détail de la demande'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `demande_details`
--

INSERT INTO `demande_details` (`id`, `demande_id`, `nature`, `libelle`, `beneficiaire`, `amount`, `nif_exists`, `nif`, `stat`, `numero_compte`, `budget_id`, `status_detail`) VALUES
(1, 1, 'charge', 'libelle1', 'benifie2', 40000.00, 'non', '', '', '', 4, 'en attente'),
(2, 2, 'appro', 'libell2', 'sefam', 700000.00, 'non', '', '', '420', NULL, 'en attente'),
(3, 3, 'appro', 'libe5', 'beni5', 400000.00, 'non', '', '', '120', NULL, 'en attente'),
(4, 4, 'appro', 'jnkno', '4bene', 40000.00, 'non', '', '', '042', NULL, 'en attente'),
(5, 4, 'appro', 'knkeb', 'njbkb', 50000.00, 'non', '', '', '420', NULL, 'en attente');

-- --------------------------------------------------------

--
-- Structure de la table `demande_validations`
--

CREATE TABLE `demande_validations` (
  `id` int(11) NOT NULL,
  `demande_id` int(11) NOT NULL COMMENT 'ID de la demande associée',
  `user_id` int(11) NOT NULL COMMENT 'ID du validateur',
  `ordre` int(11) NOT NULL COMMENT 'Ordre de validation dans la chaîne',
  `statut` varchar(50) DEFAULT 'en attente' COMMENT 'Statut de la validation pour cette demande (en attente, validé, rejeté)',
  `date_validation` datetime DEFAULT NULL,
  `commentaire` text DEFAULT NULL,
  `signature_image_url` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `signature_validation_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `demande_validations`
--

INSERT INTO `demande_validations` (`id`, `demande_id`, `user_id`, `ordre`, `statut`, `date_validation`, `commentaire`, `signature_image_url`, `createdAt`, `updatedAt`, `signature_validation_url`) VALUES
(212, 1, 41, 1, 'validé', '2025-10-20 07:04:43', '', NULL, '2025-10-20 06:55:17', '2025-10-20 07:04:43', NULL),
(213, 1, 39, 2, 'validé', '2025-10-20 18:30:15', '', NULL, '2025-10-20 06:55:17', '2025-10-20 18:30:15', NULL),
(214, 1, 40, 3, 'validé', '2025-10-21 11:09:30', '', NULL, '2025-10-20 06:55:17', '2025-10-21 11:09:30', NULL),
(215, 2, 41, 1, 'validé', '2025-10-20 07:38:28', '', NULL, '2025-10-20 06:56:36', '2025-10-20 07:38:28', NULL),
(216, 2, 39, 2, 'validé', '2025-10-21 16:23:25', '', NULL, '2025-10-20 06:56:36', '2025-10-21 16:23:25', NULL),
(217, 2, 40, 3, 'validé', '2025-10-21 16:25:37', '', NULL, '2025-10-20 06:56:36', '2025-10-21 16:25:37', NULL),
(218, 3, 42, 1, 'validé', '2025-10-21 16:26:35', '', NULL, '2025-10-20 06:58:16', '2025-10-21 16:26:35', NULL),
(219, 3, 41, 2, 'en attente', NULL, NULL, NULL, '2025-10-20 06:58:16', '2025-10-21 16:26:35', NULL),
(220, 3, 40, 3, 'initial', NULL, NULL, NULL, '2025-10-20 06:58:16', '2025-10-20 06:58:16', NULL),
(221, 4, 41, 1, 'validé', '2025-10-22 08:37:49', '', NULL, '2025-10-22 08:36:47', '2025-10-22 08:37:49', NULL),
(222, 4, 39, 2, 'validé', '2025-10-22 08:38:04', '', NULL, '2025-10-22 08:36:47', '2025-10-22 08:38:04', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `journal`
--

CREATE TABLE `journal` (
  `id_journal` int(11) NOT NULL,
  `nom_journal` varchar(255) NOT NULL,
  `nom_projet` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `solde` decimal(15,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `journal`
--

INSERT INTO `journal` (`id_journal`, `nom_journal`, `nom_projet`, `createdAt`, `updatedAt`, `solde`) VALUES
(3, 'caisse numero 2', 'Aina soa', '2025-10-20 06:47:42', '2025-10-20 06:47:42', 16000000.00),
(4, 'caisse bedfaga', 'bedfaga', '2025-10-20 06:49:01', '2025-10-20 06:49:01', 20000000.00);

-- --------------------------------------------------------

--
-- Structure de la table `journal_budget`
--

CREATE TABLE `journal_budget` (
  `journal_id` int(11) NOT NULL,
  `id_budget` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `journal_budget`
--

INSERT INTO `journal_budget` (`journal_id`, `id_budget`) VALUES
(3, 1),
(3, 4),
(4, 2),
(4, 3);

-- --------------------------------------------------------

--
-- Structure de la table `journal_sequence`
--

CREATE TABLE `journal_sequence` (
  `journal_id` int(11) NOT NULL,
  `last_num` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `journal_sequence`
--

INSERT INTO `journal_sequence` (`journal_id`, `last_num`) VALUES
(3, 3);

-- --------------------------------------------------------

--
-- Structure de la table `journal_validers`
--

CREATE TABLE `journal_validers` (
  `id` int(11) NOT NULL,
  `journal_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ordre` int(11) NOT NULL DEFAULT 1,
  `statut` varchar(50) DEFAULT 'en attente',
  `date_validation` datetime DEFAULT NULL,
  `commentaire` text DEFAULT NULL,
  `signature_image_url` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `journal_validers`
--

INSERT INTO `journal_validers` (`id`, `journal_id`, `user_id`, `ordre`, `statut`, `date_validation`, `commentaire`, `signature_image_url`, `createdAt`, `updatedAt`) VALUES
(5, 3, 39, 2, 'en attente', NULL, NULL, NULL, '2025-10-20 06:49:57', '2025-10-20 06:49:57'),
(6, 3, 41, 1, 'en attente', NULL, NULL, NULL, '2025-10-20 06:49:57', '2025-10-20 06:49:57'),
(7, 4, 39, 2, 'en attente', NULL, NULL, NULL, '2025-10-20 07:02:50', '2025-10-20 07:02:50'),
(8, 4, 42, 1, 'en attente', NULL, NULL, NULL, '2025-10-20 07:02:50', '2025-10-20 07:02:50');

-- --------------------------------------------------------

--
-- Structure de la table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(255) DEFAULT 'pending',
  `userId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `personne`
--

CREATE TABLE `personne` (
  `id` int(11) NOT NULL,
  `matricule` varchar(10) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `poste` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `personne`
--

INSERT INTO `personne` (`id`, `matricule`, `nom`, `prenom`, `poste`, `createdAt`, `updatedAt`) VALUES
(1, '4202', 'houl', 'josephk', 'Ingienieur', '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(2, '45202', 'Tiana', 'Fitia', 'Infimeier', '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(3, '4545', 'hould11', 'jea', 'garde', '0000-00-00 00:00:00', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Structure de la table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `roles`
--

INSERT INTO `roles` (`id`, `name`, `createdAt`, `updatedAt`) VALUES
(1, 'user', '2025-10-08 05:30:48', '2025-10-08 05:30:48'),
(2, 'admin', '2025-10-08 05:30:48', '2025-10-08 05:30:48'),
(3, 'caissier', '2025-10-08 05:30:48', '2025-10-08 05:30:48'),
(4, 'approver', '2025-10-08 05:30:48', '2025-10-08 05:30:48'),
(5, 'rh', '2025-10-08 05:30:48', '2025-10-08 05:30:48'),
(6, 'daf', '2025-10-08 05:30:48', '2025-10-08 05:30:48');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user','rh','daf','caissier') NOT NULL DEFAULT 'user',
  `signature_image_url` varchar(255) DEFAULT NULL,
  `delegue_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `signature_image_url`, `delegue_id`) VALUES
(1, 'Houlder', 'houlderjj38@gmail.com', '$2b$08$/UhUEEeDQo6VdMeJRlwSOekwMam3maNBOoS0XnDFVPnd8Z3fwdgey', 'admin', NULL, NULL),
(39, 'DAF', 'dafsalfa@gmail.com', '$2b$08$R3zNx1c/GICgdXWUBB3MhuwiL5uXZ2qseuMDRJW2yptja/u8.vryW', 'rh', '/uploads/signatures/signature-1760942387079-637225025.jpg', NULL),
(40, 'DG SALFA', 'dgsalfa@gmail.com', '$2b$08$Kmi7/ikxUpJDVrPWPriH3eqUUpSiy7NnHTxi2ezgA.bE34qaTcLgO', 'daf', '/uploads/signatures/signature-1760942545719-481804075.jpg', NULL),
(41, 'Miantsa', 'miantsasalfa@gmail.com', '$2b$08$hic6y5R4wYtzlmL7GuSzhOIKBS2ySXFAbltsnz6uylVtEvjLUzwXS', 'rh', '/uploads/signatures/signature-1760942615801-263561534.png', NULL),
(42, 'Sitraka ', 'sitraka@gmail.com', '$2b$08$hjzPNUjYdaSy2qja9JUCQOVu8qGFd73uwwcEB0DwzirzJxR7nYz3.', 'rh', '/uploads/signatures/signature-1760942679219-890071375.png', NULL),
(43, 'Martin', 'martin@gmail.com', '$2b$08$2vfwJVKs.APdwJXMjUJ3SOE/.0B61RcWTXJtZ0h9KEd9YABPL6YOa', 'user', NULL, NULL),
(44, 'Malala', 'malalasalfa@gmail.com', '$2b$08$rVrT0rh4uI3C7ds./ieQneB1KJO8vXm3QeJE9OgWPPY10P1G4AkVC', 'user', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `user_journals`
--

CREATE TABLE `user_journals` (
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` int(11) NOT NULL,
  `journalId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `user_journals`
--

INSERT INTO `user_journals` (`createdAt`, `updatedAt`, `userId`, `journalId`) VALUES
('2025-10-20 06:50:48', '2025-10-20 06:50:48', 43, 3),
('2025-10-20 06:51:42', '2025-10-20 06:51:42', 44, 3),
('2025-10-20 06:51:42', '2025-10-20 06:51:42', 44, 4);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `budget`
--
ALTER TABLE `budget`
  ADD PRIMARY KEY (`id_budget`);

--
-- Index pour la table `demandes`
--
ALTER TABLE `demandes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`),
  ADD KEY `journal_id` (`journal_id`),
  ADD KEY `fk_demandes_personne` (`resp_pj_id`);

--
-- Index pour la table `demande_details`
--
ALTER TABLE `demande_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `demande_id` (`demande_id`),
  ADD KEY `budget_id` (`budget_id`);

--
-- Index pour la table `demande_validations`
--
ALTER TABLE `demande_validations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `demande_id` (`demande_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `journal`
--
ALTER TABLE `journal`
  ADD PRIMARY KEY (`id_journal`);

--
-- Index pour la table `journal_budget`
--
ALTER TABLE `journal_budget`
  ADD PRIMARY KEY (`journal_id`,`id_budget`),
  ADD UNIQUE KEY `journal_budget_id_budget_journal_id_unique` (`journal_id`,`id_budget`),
  ADD KEY `id_budget` (`id_budget`);

--
-- Index pour la table `journal_sequence`
--
ALTER TABLE `journal_sequence`
  ADD PRIMARY KEY (`journal_id`);

--
-- Index pour la table `journal_validers`
--
ALTER TABLE `journal_validers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `journal_id` (`journal_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- Index pour la table `personne`
--
ALTER TABLE `personne`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Index pour la table `user_journals`
--
ALTER TABLE `user_journals`
  ADD PRIMARY KEY (`userId`,`journalId`),
  ADD KEY `journalId` (`journalId`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `budget`
--
ALTER TABLE `budget`
  MODIFY `id_budget` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `demandes`
--
ALTER TABLE `demandes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `demande_details`
--
ALTER TABLE `demande_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `demande_validations`
--
ALTER TABLE `demande_validations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=225;

--
-- AUTO_INCREMENT pour la table `journal`
--
ALTER TABLE `journal`
  MODIFY `id_journal` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `journal_validers`
--
ALTER TABLE `journal_validers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `personne`
--
ALTER TABLE `personne`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `demandes`
--
ALTER TABLE `demandes`
  ADD CONSTRAINT `demandes_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `demandes_ibfk_2` FOREIGN KEY (`journal_id`) REFERENCES `journal` (`id_journal`),
  ADD CONSTRAINT `fk_demandes_personne` FOREIGN KEY (`resp_pj_id`) REFERENCES `personne` (`id`);

--
-- Contraintes pour la table `demande_details`
--
ALTER TABLE `demande_details`
  ADD CONSTRAINT `demande_details_ibfk_1` FOREIGN KEY (`demande_id`) REFERENCES `demandes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `demande_details_ibfk_2` FOREIGN KEY (`budget_id`) REFERENCES `budget` (`id_budget`) ON DELETE SET NULL;

--
-- Contraintes pour la table `demande_validations`
--
ALTER TABLE `demande_validations`
  ADD CONSTRAINT `demande_validations_ibfk_1` FOREIGN KEY (`demande_id`) REFERENCES `demandes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `demande_validations_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `journal_budget`
--
ALTER TABLE `journal_budget`
  ADD CONSTRAINT `journal_budget_ibfk_1` FOREIGN KEY (`journal_id`) REFERENCES `journal` (`id_journal`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `journal_budget_ibfk_2` FOREIGN KEY (`id_budget`) REFERENCES `budget` (`id_budget`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `journal_validers`
--
ALTER TABLE `journal_validers`
  ADD CONSTRAINT `journal_validers_ibfk_1` FOREIGN KEY (`journal_id`) REFERENCES `journal` (`id_journal`),
  ADD CONSTRAINT `journal_validers_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `user_journals`
--
ALTER TABLE `user_journals`
  ADD CONSTRAINT `user_journals_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_journals_ibfk_2` FOREIGN KEY (`journalId`) REFERENCES `journal` (`id_journal`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
