// app.js
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const OpenApiValidator = require("express-openapi-validator");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

// Charger les variables d'environnement
require("dotenv").config();

app.use(express.json());

// Charger la spécification OpenAPI
const apiSpec = YAML.load(path.join(__dirname, "openapi.yaml"));

// Importer et utiliser les routes de l'API
const utilisateurRouter = require("./routes/utilisateur");
app.use("/utilisateurs", utilisateurRouter);

const messageRouter = require("./routes/message");
app.use("/messages", messageRouter);

const statusRouter = require("./routes/status");
app.use("/status", statusRouter);

const pieceJointeRouter = require("./routes/pieceJointe");
app.use("/pieces-jointes", pieceJointeRouter);

// Servir la documentation Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(apiSpec));

// Gestion des erreurs
app.use((err, req, res, next) => {
	// Format de réponse d'erreur
	res.status(err.status || 500).json({
		message: err.message,
		errors: err.errors,
	});
});

app.listen(port, () => {
	console.log(`Serveur en cours d'exécution sur le port ${port}`);
});
