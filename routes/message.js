// routes/message.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authenticateToken = require("../middleware/authenticateToken");

// Envoyer un message
router.post("/", authenticateToken, async (req, res) => {
	const { objet, corps, destinataires } = req.body;
	const expediteurId = req.user.id;

	try {
		// Créer le message
		const message = await prisma.message.create({
			data: {
				objet,
				corps,
				date_envoi: new Date(),
				statusId: 1, // Statut par défaut (par exemple, 1 pour "non lu")
				expediteurId,
				destinataires: {
					create: destinataires.map((destId) => ({
						id_destinataire: destId,
					})),
				},
			},
			include: {
				destinataires: true,
			},
		});

		res.status(201).json({ message: "Message envoyé avec succès", data: message });
	} catch (error) {
		res.status(400).json({ message: error.message });
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
						expediteur: true,
					},
				},
			},
		});

		res.json(messagesRecus);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

// Récupérer les messages envoyés
router.get("/envoyes", authenticateToken, async (req, res) => {
	const utilisateurId = req.user.id;

	try {
		const messagesEnvoyes = await prisma.message.findMany({
			where: {
				expediteurId: utilisateurId,
			},
			include: {
				destinataires: true,
			},
		});

		res.json(messagesEnvoyes);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

module.exports = router;
