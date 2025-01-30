-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mdp" TEXT NOT NULL,
    "date_creation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_en_ligne" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Status" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "etat" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "objet" TEXT,
    "corps" TEXT NOT NULL,
    "date_envoi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusId" INTEGER NOT NULL,
    "expediteurId" INTEGER NOT NULL,
    CONSTRAINT "Message_expediteurId_fkey" FOREIGN KEY ("expediteurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PieceJointe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom_fichier" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "chemin_de_stockage" TEXT NOT NULL,
    "messageId" INTEGER NOT NULL,
    CONSTRAINT "PieceJointe_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recevoir" (
    "id_destinataire" INTEGER NOT NULL,
    "id_message" INTEGER NOT NULL,

    PRIMARY KEY ("id_destinataire", "id_message"),
    CONSTRAINT "Recevoir_id_destinataire_fkey" FOREIGN KEY ("id_destinataire") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recevoir_id_message_fkey" FOREIGN KEY ("id_message") REFERENCES "Message" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Status_etat_key" ON "Status"("etat");
