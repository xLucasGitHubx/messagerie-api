/*
  Warnings:

  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PieceJointe` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Recevoir` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Utilisateur` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_expediteurId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_statusId_fkey`;

-- DropForeignKey
ALTER TABLE `PieceJointe` DROP FOREIGN KEY `PieceJointe_messageId_fkey`;

-- DropForeignKey
ALTER TABLE `Recevoir` DROP FOREIGN KEY `Recevoir_id_destinataire_fkey`;

-- DropForeignKey
ALTER TABLE `Recevoir` DROP FOREIGN KEY `Recevoir_id_message_fkey`;

-- DropTable
DROP TABLE `Message`;

-- DropTable
DROP TABLE `PieceJointe`;

-- DropTable
DROP TABLE `Recevoir`;

-- DropTable
DROP TABLE `Status`;

-- DropTable
DROP TABLE `Utilisateur`;

-- CreateTable
CREATE TABLE `message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `objet` VARCHAR(191) NULL,
    `corps` VARCHAR(191) NOT NULL,
    `date_envoi` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `statusId` INTEGER NOT NULL,
    `expediteurId` INTEGER NOT NULL,

    INDEX `Message_expediteurId_fkey`(`expediteurId`),
    INDEX `Message_statusId_fkey`(`statusId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `piecejointe` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom_fichier` VARCHAR(191) NOT NULL,
    `taille` INTEGER NOT NULL,
    `chemin_de_stockage` VARCHAR(191) NOT NULL,
    `messageId` INTEGER NOT NULL,

    INDEX `PieceJointe_messageId_fkey`(`messageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recevoir` (
    `id_destinataire` INTEGER NOT NULL,
    `id_message` INTEGER NOT NULL,

    INDEX `Recevoir_id_message_fkey`(`id_message`),
    PRIMARY KEY (`id_destinataire`, `id_message`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `etat` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Status_etat_key`(`etat`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utilisateur` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `mdp` VARCHAR(191) NOT NULL,
    `date_creation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status_en_ligne` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Utilisateur_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `Message_expediteurId_fkey` FOREIGN KEY (`expediteurId`) REFERENCES `utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `Message_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `status`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `piecejointe` ADD CONSTRAINT `PieceJointe_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `message`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recevoir` ADD CONSTRAINT `Recevoir_id_destinataire_fkey` FOREIGN KEY (`id_destinataire`) REFERENCES `utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recevoir` ADD CONSTRAINT `Recevoir_id_message_fkey` FOREIGN KEY (`id_message`) REFERENCES `message`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
