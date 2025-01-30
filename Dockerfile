# Utiliser une image de base officielle de Node.js avec la version 22.9.0
FROM node:22.9.0

# Définir le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copier les fichiers package.json et package-lock.json (ou yarn.lock) dans le conteneur
COPY package*.json ./

# RUN  apt-get update
# RUN  apt-get install -y openssl

# Installer les dépendances de l'application
RUN npm install
RUN npm rebuild bcrypt --build-from-source

# Copier le reste des fichiers de l'application dans le conteneur
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Appliquer les migrations pour créer les tables
RUN npx prisma migrate dev --name init

# Exposer le port sur lequel l'application va tourner
EXPOSE 3000

# Commande pour démarrer l'application
CMD ["node", "server.js"]

# Questions 3 du TP
# docker pull mysql:8.0
# docker run -d --name mydb -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 mysql:8.0
