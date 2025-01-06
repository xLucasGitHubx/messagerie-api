// app.js
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");
const OpenApiValidator = require("express-openapi-validator");

// Charger les variables d'environnement
require("dotenv").config();

const app = express();

// Parse uniquement les JSON et, si besoin, les formulaires URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Charger la spécification OpenAPI
const apiSpec = YAML.load(path.join(__dirname, "openapi.yaml"));

// Documentation Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(apiSpec));

// Désactiver la gestion multipart dans OpenAPI Validator
app.use(
	OpenApiValidator.middleware({
		apiSpec: apiSpec,
		validateRequests: {
			allowUnknownQueryParameters: true,
			multipart: false, // Désactive la gestion automatique des fichiers
		},
		validateResponses: false,
	})
);

// Routes de l'API
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
