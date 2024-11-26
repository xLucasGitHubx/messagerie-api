// routes/utilisateur.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Clé secrète pour JWT (à stocker dans un fichier .env)
const JWT_SECRET = process.env.JWT_SECRET;

// Route pour créer un utilisateur (Inscription)
router.post("/signup", async (req, res) => {
	const { nom, prenom, email, mdp } = req.body;
	try {
		// Vérifier si l'utilisateur existe déjà
		const existingUser = await prisma.utilisateur.findUnique({ where: { email } });
		if (existingUser) {
			return res.status(400).json({ message: "Email déjà utilisé" });
		}

		// Hacher le mot de passe
		const hashedPassword = await bcrypt.hash(mdp, 10);

		// Créer l'utilisateur dans la base de données
		const utilisateur = await prisma.utilisateur.create({
			data: {
				nom,
				prenom,
				email,
				mdp: hashedPassword,
			},
		});

		res.status(201).json({ message: "Utilisateur créé avec succès", utilisateur });
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
});

// Route pour la connexion d'un utilisateur
router.post("/login", async (req, res) => {
	const { email, mdp } = req.body;
	try {
		// Trouver l'utilisateur par email
		const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
		if (!utilisateur) {
			return res.status(400).json({ message: "Utilisateur non trouvé" });
		}

		// Comparer le mot de passe fourni avec le mot de passe haché
		const match = await bcrypt.compare(mdp, utilisateur.mdp);
		if (!match) {
			return res.status(400).json({ message: "Mot de passe incorrect" });
		}

		// Générer un token JWT
		const token = jwt.sign({ id: utilisateur.id }, JWT_SECRET, { expiresIn: "1h" });
		res.json({ token });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

module.exports = router;
