// routes/message.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authenticateToken = require("../middleware/authenticateToken");
const { initializeStatus } = require("../utils/databaseDefaultData");
// Envoyer un message
router.post("/", authenticateToken, async (req, res) => {
	const { objet, corps, destinataires } = req.body; // Les destinataires sont un tableau d'emails
	const expediteurId = req.user.id; // ID de l'utilisateur expéditeur, extrait du token

	try {
		await initializeStatus(prisma); // Initialiser les statuts si ce n'est pas le cas
		// Vérifiez que les emails des destinataires existent dans la base de données
		const utilisateursDestinataires = await prisma.utilisateur.findMany({
			where: {
				email: {
					in: destinataires, // Vérifie les emails des destinataires
				},
			},
			select: {
				id: true,
				email: true,
				nom: true,
				prenom: true,
			},
		});

		// Vérifiez que tous les emails fournis correspondent à des utilisateurs existants
		const emailsTrouves = utilisateursDestinataires.map((user) => user.email);
		const emailsNonTrouves = destinataires.filter((email) => !emailsTrouves.includes(email));

		if (emailsNonTrouves.length > 0) {
			return res.status(400).json({
				message: "Certains emails n'existent pas dans le système",
				emailsNonTrouves,
			});
		}

		// Créer le message et associer les destinataires
		const message = await prisma.message.create({
			data: {
				objet,
				corps,
				date_envoi: new Date(),
				statusId: 1, // Par exemple : 1 = "non lu"
				expediteurId,
				recevoir: {
					create: utilisateursDestinataires.map((dest) => ({
						id_destinataire: dest.id, // Associe l'ID des utilisateurs trouvés
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
							select: { id: true, nom: true, prenom: true, email: true }, // Infos de l'expéditeur
						},
						status: {
							// Inclure le statut du message
							select: { id: true, etat: true }, // Par exemple, "lu" ou "non lu"
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
			statut: recevoir.message.status.etat, // Inclure le statut du message
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

// Passer un message en "lu"
router.put("/recu/lu", authenticateToken, async (req, res) => {
	const utilisateurId = req.user.id; // ID de l'utilisateur connecté
	const { messageId } = req.body; // ID du message à mettre en "lu"

	try {
		// Vérifiez que le message existe et que l'utilisateur est destinataire
		const message = await prisma.recevoir.findFirst({
			where: {
				id_message: messageId,
				id_destinataire: utilisateurId,
			},
		});

		if (!message) {
			return res.status(404).json({ message: "Message non trouvé ou accès non autorisé" });
		}

		// Mettre à jour le statut du message en "lu" (id correspondant à "lu")
		await prisma.message.update({
			where: { id: messageId },
			data: { statusId: 2 }, // Remplacez "2" par l'ID correspondant à "lu" dans votre table `status`
		});

		res.status(200).json({ message: "Message marqué comme lu avec succès" });
	} catch (error) {
		console.error("Erreur lors du marquage du message comme lu :", error);
		res.status(500).json({ message: "Erreur interne", error: error.message });
	}
});

// Repasser un message en "non lu"
router.put("/recu/non-lu", authenticateToken, async (req, res) => {
	const utilisateurId = req.user.id; // ID de l'utilisateur connecté
	const { messageId } = req.body; // ID du message à remettre en "non lu"

	try {
		// Vérifiez que le message existe et que l'utilisateur est destinataire
		const message = await prisma.recevoir.findFirst({
			where: {
				id_message: messageId,
				id_destinataire: utilisateurId,
			},
		});

		if (!message) {
			return res.status(404).json({ message: "Message non trouvé ou accès non autorisé" });
		}

		// Mettre à jour le statut du message en "non lu" (id correspondant à "non lu")
		await prisma.message.update({
			where: { id: messageId },
			data: { statusId: 1 }, // Remplacez "1" par l'ID correspondant à "non lu" dans votre table `status`
		});

		res.status(200).json({ message: "Message marqué comme non lu avec succès" });
	} catch (error) {
		console.error("Erreur lors du marquage du message comme non lu :", error);
		res.status(500).json({ message: "Erreur interne", error: error.message });
	}
});

module.exports = router;
