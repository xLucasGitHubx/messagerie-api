// app.js
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");
const OpenApiValidator = require("express-openapi-validator");

// Charger les variables d'environnement
require("dotenv").config();

const app = express();

// Middleware pour parser JSON uniquement
app.use(express.json()); // Gère les requêtes JSON
// app.use(express.urlencoded({ extended: true })); // Gère les requêtes URL-encoded (si nécessaire)

// Charger la spécification OpenAPI
const apiSpec = YAML.load(path.join(__dirname, "openapi.yaml"));

// Servir la documentation Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(apiSpec));

// Middleware de validation OpenAPI
app.use(
	OpenApiValidator.middleware({
		apiSpec: apiSpec,
		validateRequests: true, // Valider les requêtes entrantes
		validateResponses: false, // Désactivé ici pour simplifier
	})
);

// Importer et utiliser les routes de l'API
const utilisateurRouter = require("./routes/utilisateur");
app.use("/utilisateurs", utilisateurRouter);

const messageRouter = require("./routes/message");
app.use("/messages", messageRouter);

// Gestion des erreurs
app.use((err, req, res, next) => {
	console.error(err);
	res.status(err.status || 500).json({
		message: err.message,
		errors: err.errors,
	});
});

// Exporter l'application pour l'utiliser dans server.js
module.exports = app;
