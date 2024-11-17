-- CreateTable
CREATE TABLE `Utilisateur` (
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

-- CreateTable
CREATE TABLE `Status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `etat` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Status_etat_key`(`etat`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `objet` VARCHAR(191) NULL,
    `corps` VARCHAR(191) NOT NULL,
    `date_envoi` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `statusId` INTEGER NOT NULL,
    `expediteurId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PieceJointe` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom_fichier` VARCHAR(191) NOT NULL,
    `taille` INTEGER NOT NULL,
    `chemin_de_stockage` VARCHAR(191) NOT NULL,
    `messageId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Recevoir` (
    `id_destinataire` INTEGER NOT NULL,
    `id_message` INTEGER NOT NULL,

    PRIMARY KEY (`id_destinataire`, `id_message`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `Status`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_expediteurId_fkey` FOREIGN KEY (`expediteurId`) REFERENCES `Utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PieceJointe` ADD CONSTRAINT `PieceJointe_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Recevoir` ADD CONSTRAINT `Recevoir_id_destinataire_fkey` FOREIGN KEY (`id_destinataire`) REFERENCES `Utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Recevoir` ADD CONSTRAINT `Recevoir_id_message_fkey` FOREIGN KEY (`id_message`) REFERENCES `Message`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
