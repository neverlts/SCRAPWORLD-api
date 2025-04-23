# ScrapWorld NFT API

API REST pour le projet NFT ScrapWorld, construite avec Next.js (App Router) et TypeScript, connectée à Supabase.

## Configuration

1. Clonez ce dépôt
2. Installez les dépendances:
   \`\`\`bash
   npm install
   \`\`\`
3. Créez un fichier `.env.local` avec les variables suivantes:
   \`\`\`
   SUPABASE_URL=votre_url_supabase
   SUPABASE_ANON_KEY=votre_clé_anonyme
   \`\`\`
4. Lancez le serveur de développement:
   \`\`\`bash
   npm run dev
   \`\`\`

## Endpoints API

### GET /api/token/[tokenId]
Récupère les métadonnées d'un NFT spécifique.

**Paramètres:**
- `tokenId`: ID du token NFT

**Réponse:**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "ScrapWorld #42",
    "image_url": "https://example.com/nft42.png",
    "attributes": { ... },
    "owner_id": "123e4567-e89b-12d3-a456-426614174001"
  }
}
\`\`\`

### POST /api/fusion
Fusionne deux NFTs pour en créer un nouveau.

**Corps de la requête:**
\`\`\`json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174001",
  "nft1_id": "123e4567-e89b-12d3-a456-426614174002",
  "nft2_id": "123e4567-e89b-12d3-a456-426614174003"
}
\`\`\`

**Réponse:**
\`\`\`json
{
  "success": true,
  "data": {
    "message": "Fusion réussie",
    "result_nft": { ... }
  }
}
\`\`\`

### GET /api/staking/[userId]
Récupère l'état du staking pour un utilisateur.

**Paramètres:**
- `userId`: ID de l'utilisateur

**Réponse:**
\`\`\`json
{
  "success": true,
  "data": {
    "user_id": "123e4567-e89b-12d3-a456-426614174001",
    "staking": [ ... ],
    "total_staked": 1000
  }
}
\`\`\`

###  "123e4567-e89b-12d3-a456-426614174001",
    "staking": [ ... ],
    "total_staked": 1000
  }
}
\`\`\`

### POST /api/staking
Permet à un utilisateur de staker des $SCRAP.

**Corps de la requête:**
\`\`\`json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174001",
  "amount": 500
}
\`\`\`

**Réponse:**
\`\`\`json
{
  "success": true,
  "data": {
    "message": "Staking réussi",
    "staking": { ... },
    "new_balance": 1500
  }
}
\`\`\`

### GET /api/quests/[userId]
Récupère les quêtes en cours ou complétées par un utilisateur.

**Paramètres:**
- `userId`: ID de l'utilisateur

**Réponse:**
\`\`\`json
{
  "success": true,
  "data": {
    "user_id": "123e4567-e89b-12d3-a456-426614174001",
    "completed": [ ... ],
    "in_progress": [ ... ],
    "available": [ ... ],
    "total_quests": 10,
    "completed_count": 3
  }
}
\`\`\`

## Générateur de NFT

Le script `scripts/generator.ts` permet de générer une collection d'images NFT et leurs métadonnées.

### Prérequis

1. Créez un dossier `assets/layers` avec la structure suivante:
   \`\`\`
   assets/layers/
   ├── 01-Background-0-0/
   │   ├── 01-Blue-10.png
   │   ├── 02-Red-10.png
   │   └── ...
   ├── 02-Body-0-0/
   │   ├── 01-Robot-10.png
   │   ├── 02-Alien-5.png
   │   └── ...
   └── ...
   \`\`\`

2. Chaque dossier de couche suit le format: `[index]-[nom]-[posX]-[posY]`
3. Chaque fichier d'élément suit le format: `[index]-[nom]-[poids].[extension]`

### Exécution

\`\`\`bash
npx ts-node scripts/generator.ts
\`\`\`

Les images et métadonnées générées seront sauvegardées dans le dossier `output/`.

## Déploiement sur Vercel

Ce projet est prêt à être déployé sur Vercel. Assurez-vous d'ajouter les variables d'environnement SUPABASE_URL et SUPABASE_ANON_KEY dans les paramètres du projet sur Vercel.
