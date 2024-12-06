async function initializeStatus(prisma) {
	const existingStatuses = await prisma.status.findMany({
		where: { etat: { in: ["non lu", "lu"] } },
	});

	const existingStatusNames = existingStatuses.map((status) => status.etat);

	const missingStatuses = [];
	if (!existingStatusNames.includes("non lu")) {
		missingStatuses.push({ etat: "non lu" });
	}
	if (!existingStatusNames.includes("lu")) {
		missingStatuses.push({ etat: "lu" });
	}

	if (missingStatuses.length > 0) {
		await prisma.status.createMany({
			data: missingStatuses,
		});
		console.log("Statuts manquants ajoutés :", missingStatuses);
	}
}

module.exports = { initializeStatus };
