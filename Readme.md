# Chat Application with Spotify Integration

Une application de chat en temps réel avec intégration Itune, permettant aux utilisateurs de discuter et d'écouter de la musique ensemble dans différentes salles.

## Fonctionnalités

### Chat

- Création de salles de discussion
- Messages en temps réel
- Indicateurs de présence des utilisateurs
- Profils utilisateurs personnalisables avec couleurs
- Interface responsive

### Intégration Itune

- Recherche de musique
- Lecture synchronisée pour tous les utilisateurs d'une salle
- File d'attente de lecture partagée
- Contrôles de lecture (play/pause, suivant, précédent)
- Affichage des informations de la chanson en cours

## Prérequis

- Node.js (v18 ou supérieur)
- PostgreSQL

## Configuration

### Backend

1. Cloner le repository
2. Installer les dépendances

```bash
npm install
```

3. Configurer les variables d'environnement
   Créer un fichier `.env` à la racine du dossier backend avec :

```env
DATABASE_URL="postgresql://chatdb:chatdb@localhost:5432/chatdb?schema=public"
JWT_SECRET="votre_secret_jwt"
```

4. Initialiser la base de données

```bash
npx prisma migrate dev
```

5. Lancer le serveur

```bash
npm run start:dev
```

### Frontend

1. Se placer dans le dossier frontend

```bash
cd ../frontend
```

2. Installer les dépendances

```bash
npm install
```

3. Lancer l'application

```bash
npm run dev
```

## Structure du Projet

### Backend (NestJS)

- `auth/` - Authentification et gestion des utilisateurs
- `chat/` - WebSocket et logique de chat
- `prisma/` - Configuration de la base de données
- `users/` - Gestion des profils utilisateurs

### Frontend (Vue 3 + TypeScript)

- `components/` - Composants Vue réutilisables
- `composables/` - Logique réutilisable
- `store/` - Gestion d'état avec Pinia
- `types/` - Définitions TypeScript
- `views/` - Pages de l'application

## Technologies Utilisées

### Backend

- NestJS
- Socket.io
- Prisma
- PostgreSQL
- JWT

### Frontend

- Vue 3
- TypeScript
- Vite
- Tailwind CSS
- Pinia
- Socket.io-client

## Points d'API

### Authentication

- POST `/auth/login` - Connexion
- POST `/auth/register` - Inscription
- GET `/auth/current` - Informations utilisateur courant

### WebSocket Events

- `joinRoom` - Rejoindre une salle
- `leaveRoom` - Quitter une salle
- `message` - Envoyer un message
- `createRoom` - Créer une nouvelle salle

## Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## Licence

MIT
