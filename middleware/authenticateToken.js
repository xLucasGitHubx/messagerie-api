// middleware/authenticateToken.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
	const authHeader = req.headers["authorization"];
	// let token = req.headers?.authorization; // Get the token from the headers

	const token = authHeader && authHeader.split(" ")[1];

	if (token == null) return res.status(401).json({ message: "Token manquant" });

	jwt.verify(token, JWT_SECRET, (err, user) => {
		if (err) return res.status(403).json({ message: "Token invalide" });
		req.user = user;
		next();
	});
}

module.exports = authenticateToken;
