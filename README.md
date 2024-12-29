# **API de Messagerie Privée**

Cette API permet la gestion d'une messagerie privée avec des fonctionnalités telles que l'inscription, la connexion, l'envoi et la réception de messages, ainsi que la gestion des pièces jointes et des statuts.

---

## **Installation et Configuration**

### **Prérequis**

- **Node.js** : Version 22.9.0
- **MySQL** : Base de données configurée sur machine locale.

### **Étape 1 : Cloner le Projet**

Clonez le dépôt de l'API sur votre machine locale :

```bash
git clone <URL_DU_DEPOT>
cd messagerie-api
```

---

### **Étape 2 : Installer les Dépendances**

Installez toutes les dépendances nécessaires avec npm :

```bash
npm install
```

**Packages utilisés :**

| Package                     | Utilisation                                               |
| --------------------------- | --------------------------------------------------------- |
| `express`                   | Framework pour créer les routes et gérer les requêtes.    |
| `prisma`                    | ORM pour gérer la base de données.                        |
| `@prisma/client`            | Client Prisma généré à partir du schéma.                  |
| `dotenv`                    | Charger les variables d'environnement depuis `.env`.      |
| `express-openapi-validator` | Validation des requêtes/réponses avec OpenAPI.            |
| `swagger-ui-express`        | Documentation interactive des routes avec Swagger.        |
| `yamljs`                    | Charger les fichiers YAML pour Swagger.                   |
| `jsonwebtoken`              | Gérer l'authentification avec JWT.                        |
| `bcrypt`                    | Hachage sécurisé des mots de passe.                       |
| `multer@1.4.3`              | Gestion de l'upload des fichiers pour les pièces jointes. |

---

### **Étape 3 : Configuration de la Base de Données**

1. Configurez une base de données MySQL. Voici un exemple pour créer une base de données :

   ```sql
   CREATE DATABASE messagerie_api;
   ```

2. Mettez à jour le fichier `.env` à la racine du projet pour y inclure vos informations de connexion MySQL :

   ```env
   DATABASE_URL="mysql://<username>:<password>@localhost:3306/messagerie_api"
   JWT_SECRET="votre_clé_secrète"
   PORT=3000
   ```

   Remplacez `<username>` et `<password>` par vos identifiants MySQL.

---

### **Étape 4 : Initialiser Prisma**

1. Générez le client Prisma à partir du schéma :

   ```bash
   npx prisma generate
   ```

2. Appliquez les migrations pour créer les tables dans la base de données :

   ```bash
   npx prisma migrate dev --name init
   ```

---

### **Étape 5 : Lancer le Serveur**

Démarrez le serveur avec la commande suivante :

```bash
node server.js
```

Le serveur est accessible sur [http://localhost:3000](http://localhost:3000).

-à faire mieux gérer authentification

- revoir doc
  -effectuer des test
