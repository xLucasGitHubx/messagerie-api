/**
 * Fichier : routes/upload.js
 * Description : Gestion des routes pour l'envoi, la réception, et la mise à jour de messages,
 *               ainsi que l'upload de pièces jointes via Multer (multipart/form-data).
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authenticateToken = require("../middleware/authenticateToken");
const { initializeStatus } = require("../utils/databaseDefaultData");
const fs = require("fs");
const path = require("path");

//----------------------------------------------------------
// 1. Configuration de Multer pour la gestion des fichiers
//----------------------------------------------------------
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		// Chemin où seront sauvegardés les fichiers uploadés
		const dir = path.join(__dirname, "..", "..", "uploads");

		// Vérifie si le dossier existe ; sinon, le créer
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		cb(null, dir);
	},
	filename: (req, file, cb) => {
		// Renomme le fichier en préfixant un timestamp pour éviter les conflits de nom
		cb(null, Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_"));
	},
});

const upload = multer({
	storage: storage,
	limits: { fileSize: 100 * 1024 * 1024 }, // Limite de 100 Mo par fichier
	fileFilter: (req, file, cb) => {
		// Types de fichiers autorisés
		const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
		if (allowedMimeTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Type de fichier non autorisé"));
		}
	},
});

//-------------------------------------------------------------------------
/**
 * Route POST pour envoyer un message avec pièces jointes (multipart/form-data)
 * Utilise upload.single('file') pour un seul fichier
 */
router.post("/", authenticateToken, upload.single("file"), async (req, res) => {
	try {
		// Logs pour comprendre ce que le serveur reçoit
		console.log("Headers reçus :", req.headers);
		console.log("Body reçu :", req.body);
		console.log("Fichier reçu :", req.file);

		// Extraction des données du body (champs texte)
		const { objet, corps, destinataires } = req.body;
		const expediteurId = req.user.id; // ID de l'utilisateur issu du token

		// Vérification du champ 'corps'
		if (!corps || !corps.trim()) {
			return res.status(400).json({
				message: "Le champ 'corps' est requis et ne peut pas être vide.",
			});
		}

		// Vérification du champ 'destinataires'
		if (!destinataires || !destinataires.trim()) {
			return res.status(400).json({
				message: "Le champ 'destinataires' est requis (sous forme de chaîne JSON).",
			});
		}

		// Tentative de parse du JSON (destinataires doit être un tableau de strings)
		let parsedDestinataires;
		try {
			parsedDestinataires = JSON.parse(destinataires);
		} catch (error) {
			return res.status(400).json({
				message: "Le champ 'destinataires' doit être un tableau JSON valide.",
			});
		}

		// Vérifie que parsedDestinataires est un tableau non vide
		if (!Array.isArray(parsedDestinataires) || parsedDestinataires.length === 0) {
			return res.status(400).json({
				message: "Le champ 'destinataires' doit être un tableau non vide.",
			});
		}

		// Initialiser éventuellement les statuts (ex. : 'non lu', 'lu', ...)
		await initializeStatus(prisma);

		// Vérifie que les utilisateurs destinataires existent en base
		const utilisateursDestinataires = await prisma.utilisateur.findMany({
			where: {
				email: {
					in: parsedDestinataires,
				},
			},
			select: {
				id: true,
				email: true,
				nom: true,
				prenom: true,
			},
		});

		// Compare les emails trouvés et ceux envoyés
		const emailsTrouves = utilisateursDestinataires.map((user) => user.email);
		const emailsNonTrouves = parsedDestinataires.filter((email) => !emailsTrouves.includes(email));

		if (emailsNonTrouves.length > 0) {
			return res.status(400).json({
				message: "Certains emails n'existent pas dans le système",
				emailsNonTrouves,
			});
		}

		// Prépare les données des pièces jointes
		let files = [];
		if (req.file) {
			files.push({
				nom_fichier: req.file.originalname,
				taille: req.file.size,
				chemin_de_stockage: req.file.path,
			});
		}

		// Création du message dans la base de données
		const message = await prisma.message.create({
			data: {
				objet, // Objet du message
				corps, // Corps du message
				date_envoi: new Date(),
				expediteurId, // ID de l'utilisateur expéditeur
				statusId: 1, // Par défaut : "non lu", selon votre table 'status'
				recevoir: {
					create: utilisateursDestinataires.map((dest) => ({
						id_destinataire: dest.id,
					})),
				},
				piecejointe: {
					create: files, // On associe les pièces jointes
				},
			},
			include: {
				// Permet de retourner les données des destinataires et des pièces jointes dans la réponse
				piecejointe: true,
				recevoir: {
					include: {
						utilisateur: true,
					},
				},
			},
		});

		// Réponse en cas de succès
		res.status(201).json({
			message: "Message envoyé avec succès",
			data: message,
		});
	} catch (error) {
		console.error("Erreur lors de l'envoi du message :", error);
		res.status(500).json({
			message: "Une erreur interne s'est produite.",
			error: error.message,
		});
	}
});

// Export du router
module.exports = router;
