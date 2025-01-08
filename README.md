# **API de Messagerie Privée**

Bienvenue dans l’API de messagerie privée. Ce projet vous permet de gérer l’inscription, la connexion, l’envoi et la réception de messages, la gestion des pièces jointes, ainsi que la mise à jour du statut des messages (lu / non lu). Elle s’appuie sur **Node.js**, **Express**, **Prisma** et **MySQL**, tout en exposant une **documentation OpenAPI** accessible via Swagger.

---

## **Sommaire**

1. [Fonctionnalités Principales](#fonctionnalités-principales)
2. [Installation et Configuration](#installation-et-configuration)
   1. [Prérequis](#prérequis)
   2. [Cloner le Projet](#cloner-le-projet)
   3. [Installer les Dépendances](#installer-les-dépendances)
   4. [Configurer la Base de Données](#configurer-la-base-de-données)
   5. [Initialiser Prisma](#initialiser-prisma)
   6. [Lancer le Serveur](#lancer-le-serveur)
3. [Routes Principales](#routes-principales)
4. [Documentation OpenAPI](#documentation-openapi)
5. [Recommandations pour les Tests](#recommandations-pour-les-tests)

---

## **Fonctionnalités Principales**

- **Inscription et Connexion** d’utilisateurs : Création d’un compte et authentification via JWT.
- **Envoi de Messages** : Envoi d’un message à un ou plusieurs destinataires, avec ou sans pièces jointes.
- **Réception de Messages** : Liste des messages reçus, incluant le statut (lu / non lu), l’expéditeur et les pièces jointes associées.
- **Mise à jour du Statut** : Marquer un message comme _lu_ ou le repasser en _non lu_.
- **Gestion des Pièces Jointes** : Upload et téléchargement de fichiers liés à un message.
- **Documentation Swagger** : Visualisation et test des endpoints via l’interface Swagger UI.

---

## **Installation et Configuration**

### **Prérequis**

- **Node.js** : Version recommandée >= **22.9.0**
- **MySQL** : Serveur MySQL opérationnel localement ou accessible via réseau

> **Astuce :** Vous pouvez également utiliser Docker pour faire tourner votre base de données.

---

### **Cloner le Projet**

```bash
git clone <URL_DU_DEPOT>  # remplacez <URL_DU_DEPOT> par l'URL réelle
cd messagerie-api
```

---

### **Installer les Dépendances**

```bash
npm install
```

#### **Détails sur les dépendances clés :**

| Package                       | Rôle                                                                       |
| ----------------------------- | -------------------------------------------------------------------------- |
| **express**                   | Framework pour créer les routes et gérer les requêtes HTTP                 |
| **prisma** + `@prisma/client` | ORM & Client Prisma pour interagir avec la base de données MySQL           |
| **dotenv**                    | Gestion des variables d'environnement (fichier `.env`)                     |
| **express-openapi-validator** | Validation des requêtes/réponses en se basant sur la spécification OpenAPI |
| **swagger-ui-express**        | Affichage d’une documentation interactive via Swagger UI                   |
| **yamljs**                    | Chargement des fichiers YAML (ex. pour Swagger)                            |
| **jsonwebtoken**              | Génération et validation de token JWT                                      |
| **bcrypt**                    | Hachage sécurisé des mots de passe                                         |
| **multer@1.4.3**              | Upload des fichiers (pièces jointes) pour les messages                     |

> **Note :**
>
> - **Multer** est déjà inclus viaexpress-openapi-validator. Il est configurer en `overrides` dans votre `package.json` pour forcer la version `1.4.3`, sans avoir à exécuter `npm install multer@1.4.3`.
> - **Pas besoin** de l’installer, ni forcer la version 1.4.3 le `package.json` est correctement configuré pour remplir cette tâche si vous rencontrer des probleme liée au pièces jointes penser à vérifier ce fichier. (un simple `npm install` suffit à l'initilisation des dépendances du projet)

---

### **Configurer la Base de Données**

1. **Créer un fichier `.env`** à la racine du projet.
2. **Modifier les variables** pour qu’elles correspondent à votre environnement :

```bash
DATABASE_URL="mysql://<USERNAME>:<PASSWORD>@localhost:3306/messagerie_api"
JWT_SECRET="votre_clé_secrète"
PORT=3000
```

- `DATABASE_URL` : Identifiants MySQL (`<USERNAME>` et `<PASSWORD>`) + nom de la base (`messagerie_api`).
- `JWT_SECRET` : Votre clé secrète pour signer les tokens JWT.
- `PORT` : Le port d’écoute de l’API (3000 par défaut).

---

### **Initialiser Prisma**

1. **Générer le client** Prisma :

   ```bash
   npx prisma generate
   ```

2. **Appliquer les migrations** pour créer les tables :

   ```bash
   npx prisma migrate dev --name init
   ```

   > Si la base `messagerie_api` n’existe pas, Prisma la créera automatiquement.

---

### **Lancer le Serveur**

```bash
node server.js
```

- Le serveur démarre et écoute par défaut sur [http://localhost:3000](http://localhost:3000).
- Les variables `DATABASE_URL` et `JWT_SECRET` doivent être valides pour éviter les erreurs d’exécution.

---

## **Routes Principales**

- **POST** `/utilisateurs/signup` : Inscription d’un nouvel utilisateur.
- **POST** `/utilisateurs/login` : Connexion d’un utilisateur, retour du token JWT.
- **POST** `/messages/upload` : Envoi d’un message avec ou sans pièces jointes (multipart/form-data).
- **GET** `/messages/recu` : Liste des messages reçus par l’utilisateur connecté.
- **GET** `/messages/envoyes` : Liste des messages envoyés par l’utilisateur connecté.
- **GET** `messages/{messageId}/attachements/{attachementId}` : Télécharger la pièce jointe contenu dans un message.
- **PUT** `/messages/recu/lu` : Marquer un message comme _lu_.
- **PUT** `/messages/recu/non-lu` : Repasser un message à _non lu_.

> **Astuce** : Pour **tester l’envoi de fichiers**, sélectionnez `form-data` dans Postman et utilisez le champ `files` de type **File** pour chaque pièce jointe.

---

## **Documentation OpenAPI**

- **Fichier** : `openapi.yaml` à la racine ou dans un dossier dédié.
- **Consultation** : Rendez-vous sur [http://localhost:3000/api-docs](http://localhost:3000/api-docs) pour accéder à l’interface **Swagger UI**.
- **Validation** : Les requêtes sont validées par `express-openapi-validator` au regard du schéma **OpenAPI**.

---

## **Recommandations pour les Tests**

1. **Créer au moins 2 utilisateurs** pour pouvoir échanger des messages.
2. **Tester l’envoi de messages** avec :
   - **Aucun fichier** (champ `files` omis)
   - **1 fichier** (champ `files` de type File)
3. **Vérifier les statuts** : Envoyer un message, le marquer comme _lu_, puis vérifier sa liste de messages reçus.
4. **Télécharger les pièces jointes** pour s’assurer que les données sont bien envoyées.

Vous pouvez créer une **collection Postman** pour regrouper et automatiser ces tests.

---
