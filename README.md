# FLOUZ - Application de Caisse

## Installation et Démarrage

### Sur Replit
```bash
npm run dev
```

### Sur Windows (Développement Local)

1. **Installation des dépendances**
```bash
npm install
```

2. **Démarrage de l'application**

Option 1 - Commande simple :
```bash
npm run dev
```

Option 2 - Fichier batch (double-clic) :
```
dev.bat
```

L'application sera disponible sur : **http://localhost:5000**

## Comptes de Démonstration

- **Compte Demo** : `demo@flouz.com` / `demo123`
- **Compte Master** : `flouz@mail.com` / `rootsesmort`

## Fonctionnalités

- ✅ Point de vente tactile optimisé
- ✅ Gestion des produits et catégories
- ✅ Export CSV des transactions
- ✅ Clôture de caisse avec notifications Telegram
- ✅ Système multi-employés
- ✅ Session unique par compte
- ✅ Interface française complète

## Base de Données

PostgreSQL avec migrations Drizzle ORM :
```bash
npm run db:push
```