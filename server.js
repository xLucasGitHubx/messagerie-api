// server.js
const app = require("./app"); // Importer l'application configurée
const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`Serveur en cours d'exécution sur le port ${port}`);
});
