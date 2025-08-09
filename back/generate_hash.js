// generate_hash.js
const bcrypt = require('bcryptjs'); // Assurez-vous que 'bcryptjs' est installé (npm install bcryptjs)
const passwordToHash = 'Houlder38'; // Le mot de passe en texte clair que vous voulez utiliser
const saltRounds = 8; // Cela doit correspondre au coût dans vos hachages ($2a$08$)

bcrypt.hash(passwordToHash, saltRounds, function(err, hash) {
    if (err) {
        console.error("Erreur lors du hachage du mot de passe :", err);
        return;
    }
    console.log("\n------------------------------------------------");
    console.log("Copiez le HACHAGE ci-dessous et insérez-le dans votre base de données :");
    console.log(hash); // Cette ligne affiche le hachage généré
    console.log("------------------------------------------------\n");
});