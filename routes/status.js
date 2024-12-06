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
module.exports = router;
