// routes/pieceJointe.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authenticateToken = require("../middleware/authenticateToken");
const path = require("path");
const fs = require("fs");

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const dir = "./uploads/";
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}
		cb(null, dir);
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + "-" + file.originalname);
	},
});

const upload = multer({ storage: storage });

// Ajouter une pièce jointe à un message
router.post("/:messageId", authenticateToken, upload.single("file"), async (req, res) => {
	const { messageId } = req.params;
	const file = req.file;

	try {
		const pieceJointe = await prisma.pieceJointe.create({
			data: {
				nom_fichier: file.originalname,
				taille: file.size,
				chemin_de_stockage: file.path,
				messageId: parseInt(messageId),
			},
		});

		res.status(201).json({ message: "Pièce jointe ajoutée avec succès", data: pieceJointe });
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
});

// Télécharger une pièce jointe
router.get("/:id", authenticateToken, async (req, res) => {
	const { id } = req.params;

	try {
		const pieceJointe = await prisma.pieceJointe.findUnique({
			where: { id: parseInt(id) },
		});

		if (!pieceJointe) {
			return res.status(404).json({ message: "Pièce jointe non trouvée" });
		}

		res.download(path.resolve(pieceJointe.chemin_de_stockage), pieceJointe.nom_fichier);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

module.exports = router;
