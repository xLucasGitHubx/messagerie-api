/**
 * Fichier : routes/message.js
 * Description : Gestion des routes pour l'envoi, la réception, et la mise à jour de messages,
 *               ainsi que l'upload de pièces jointes via Multer (multipart/form-data).
 */

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authenticateToken = require("../middleware/authenticateToken");

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
