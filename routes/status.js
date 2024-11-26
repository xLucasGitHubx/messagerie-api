// routes/status.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Obtenir tous les statuts
router.get("/", async (req, res) => {
	try {
		const statuts = await prisma.status.findMany();
		res.json(statuts);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

// Créer un nouveau statut
router.post("/", async (req, res) => {
	const { etat } = req.body;
	try {
		const nouveauStatut = await prisma.status.create({
			data: { etat },
		});
		res.status(201).json(nouveauStatut);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
});

module.exports = router;
