/**
 * Fichier : routes/message.js
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
		cb(null, Date.now() + "-" + file.originalname);
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

// Middleware pour désactiver express.json() pour multipart/form-data
// router.use((req, res, next) => {
// 	if (req.is("multipart/form-data")) {
// 		return next();
// 	}
// 	express.json()(req, res, next);
// });

//-------------------------------------------------------------------------
// 2. Route POST pour envoyer un message avec pièces jointes (multipart/form-data)
//-------------------------------------------------------------------------
router.post("/", authenticateToken, upload.single("files"), async (req, res) => {
	try {
		// Logs pour comprendre ce que le serveur reçoit
		console.log("Headers reçus :", req.headers);
		console.log("Body reçu :", req.body);
		console.log("Fichiers reçus :", req.files);

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

		// Validation de la présence des fichiers
		// (si vous souhaitez obliger au moins un fichier, décommentez la ligne ci-dessous)
		// if (!req.files || req.files.length === 0) {
		//   return res.status(400).json({ message: "Aucun fichier n'a été uploadé." });
		// }

		// Prépare les données des pièces jointes
		const files = req.files.map((file) => ({
			nom_fichier: file.originalname,
			taille: file.size,
			chemin_de_stockage: file.path,
		}));

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

//--------------------------------------------------------------------
// 3. Route GET : Récupérer les messages reçus par l'utilisateur
//--------------------------------------------------------------------
router.get("/recu", authenticateToken, async (req, res) => {
	const utilisateurId = req.user.id;

	try {
		const messagesRecus = await prisma.recevoir.findMany({
			where: { id_destinataire: utilisateurId },
			include: {
				message: {
					include: {
						// Infos sur l'expéditeur
						utilisateur: { select: { id: true, nom: true, prenom: true, email: true } },
						// Pièces jointes
						piecejointe: true,
						// Statut (non lu, lu, etc.)
						status: { select: { id: true, etat: true } },
					},
				},
			},
		});

		// Reformate la structure des messages pour une meilleure lisibilité
		const formattedMessages = messagesRecus.map((recevoir) => ({
			id: recevoir.message.id,
			objet: recevoir.message.objet,
			corps: recevoir.message.corps,
			date_envoi: recevoir.message.date_envoi,
			statut: recevoir.message.status.etat, // "non lu" ou "lu"
			expediteur: recevoir.message.utilisateur,
			piecejointe: recevoir.message.piecejointe.map((file) => ({
				id: file.id,
				nom_fichier: file.nom_fichier,
				taille: file.taille,
				chemin_de_stockage: file.chemin_de_stockage,
			})),
		}));

		res.json(formattedMessages);
	} catch (error) {
		res.status(500).json({
			message: "Erreur lors de la récupération des messages reçus",
			error: error.message,
		});
	}
});

//-------------------------------------------------------------------
// 4. Route GET : Récupérer les messages envoyés par l'utilisateur
//-------------------------------------------------------------------
router.get("/envoyes", authenticateToken, async (req, res) => {
	const utilisateurId = req.user.id; // ID extrait du token

	try {
		const messagesEnvoyes = await prisma.message.findMany({
			where: {
				expediteurId: utilisateurId,
			},
			include: {
				recevoir: {
					include: {
						utilisateur: { select: { id: true, nom: true, prenom: true, email: true } },
					},
				},
				piecejointe: true,
			},
		});

		// Reformate les messages pour inclure les destinataires et les pièces jointes
		const formattedMessages = messagesEnvoyes.map((message) => ({
			id: message.id,
			objet: message.objet,
			corps: message.corps,
			date_envoi: message.date_envoi,
			destinataires: message.recevoir.map((dest) => ({
				id_destinataire: dest.utilisateur.id,
				nom: dest.utilisateur.nom,
				prenom: dest.utilisateur.prenom,
				email: dest.utilisateur.email,
			})),
			piecejointe: message.piecejointe.map((file) => ({
				id: file.id,
				nom_fichier: file.nom_fichier,
				taille: file.taille,
				chemin_de_stockage: file.chemin_de_stockage,
			})),
		}));

		res.json(formattedMessages);
	} catch (error) {
		res.status(500).json({
			message: "Erreur lors de la récupération des messages envoyés",
			error: error.message,
		});
	}
});

//-------------------------------------------------------------------
// 5. Route PUT : Marquer un message reçu comme "lu"
//-------------------------------------------------------------------
router.put("/recu/lu", authenticateToken, async (req, res) => {
	const utilisateurId = req.user.id; // ID de l'utilisateur connecté
	const { messageId } = req.body; // ID du message à mettre en "lu"

	try {
		// Vérifie que le message existe et que l'utilisateur est bien destinataire
		const message = await prisma.recevoir.findFirst({
			where: {
				id_message: messageId,
				id_destinataire: utilisateurId,
			},
		});

		if (!message) {
			return res.status(404).json({ message: "Message non trouvé ou accès non autorisé" });
		}

		// Met à jour le statut du message en "lu" (id = 2, par exemple)
		await prisma.message.update({
			where: { id: messageId },
			data: { statusId: 2 },
		});

		res.status(200).json({ message: "Message marqué comme lu avec succès" });
	} catch (error) {
		console.error("Erreur lors du marquage du message comme lu :", error);
		res.status(500).json({ message: "Erreur interne", error: error.message });
	}
});

//-------------------------------------------------------------------
// 6. Route PUT : Marquer un message reçu comme "non lu"
//-------------------------------------------------------------------
router.put("/recu/non-lu", authenticateToken, async (req, res) => {
	const utilisateurId = req.user.id;
	const { messageId } = req.body; // ID du message à remettre en "non lu"

	try {
		// Vérifie que le message existe et que l'utilisateur est destinataire
		const message = await prisma.recevoir.findFirst({
			where: {
				id_message: messageId,
				id_destinataire: utilisateurId,
			},
		});

		if (!message) {
			return res.status(404).json({ message: "Message non trouvé ou accès non autorisé" });
		}

		// Met à jour le statut du message en "non lu" (id = 1, par exemple)
		await prisma.message.update({
			where: { id: messageId },
			data: { statusId: 1 },
		});

		res.status(200).json({ message: "Message marqué comme non lu avec succès" });
	} catch (error) {
		console.error("Erreur lors du marquage du message comme non lu :", error);
		res.status(500).json({ message: "Erreur interne", error: error.message });
	}
});

// Export du router
module.exports = router;
