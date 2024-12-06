// routes/message.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authenticateToken = require("../middleware/authenticateToken");
const { initializeStatus } = require("../utils/databaseDefaultData");
// Envoyer un message
router.post("/", authenticateToken, async (req, res) => {
	const { objet, corps, destinataires } = req.body;
	const expediteurId = req.user.id; // ID de l'utilisateur expéditeur, extrait du token

	try {
		await initializeStatus(prisma);

		// Créer le message et associer les destinataires
		const message = await prisma.message.create({
			data: {
				objet,
				corps,
				date_envoi: new Date(),
				statusId: 1, // Par exemple : 1 = "non lu"
				expediteurId,
				recevoir: {
					create: destinataires.map((destId) => ({
						id_destinataire: destId, // Ajout des destinataires liés au message
					})),
				},
			},
			include: {
				recevoir: {
					include: {
						utilisateur: true, // Inclure les détails des utilisateurs destinataires
					},
				},
			},
		});

		res.status(201).json({
			message: "Message envoyé avec succès",
			data: message,
		});
	} catch (error) {
		console.error("Erreur lors de l'envoi du message :", error);
		res.status(400).json({
			message: "Une erreur est survenue lors de l'envoi du message.",
			error: error.message,
		});
	}
});

// Récupérer les messages reçus
router.get("/recu", authenticateToken, async (req, res) => {
	const utilisateurId = req.user.id;

	try {
		const messagesRecus = await prisma.recevoir.findMany({
			where: {
				id_destinataire: utilisateurId,
			},
			include: {
				message: {
					include: {
						utilisateur: {
							// L'expéditeur est représenté par "utilisateur"
							select: { id: true, nom: true, prenom: true, email: true },
						},
					},
				},
			},
		});

		const formattedMessages = messagesRecus.map((recevoir) => ({
			id: recevoir.message.id,
			objet: recevoir.message.objet,
			corps: recevoir.message.corps,
			date_envoi: recevoir.message.date_envoi,
			expediteur: {
				id: recevoir.message.utilisateur.id,
				nom: recevoir.message.utilisateur.nom,
				prenom: recevoir.message.utilisateur.prenom,
				email: recevoir.message.utilisateur.email,
			},
		}));

		res.json(formattedMessages);
	} catch (error) {
		res.status(500).json({ message: "Erreur lors de la récupération des messages reçus", error: error.message });
	}
});

// Récupérer les messages envoyés
router.get("/envoyes", authenticateToken, async (req, res) => {
	const utilisateurId = req.user.id; // ID extrait du token utilisateur

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
			},
		});

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
		}));

		res.json(formattedMessages);
	} catch (error) {
		res.status(500).json({ message: "Erreur lors de la récupération des messages envoyés", error: error.message });
	}
});

module.exports = router;
