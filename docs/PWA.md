# Progressive Web App (PWA) & Mode Hors-Ligne — Animor

## 1. Configuration PWA

Animor est configurée via `vite-plugin-pwa` avec Workbox :
- **Mode d'enregistrement** : `autoUpdate` pour charger automatiquement les nouvelles versions en arrière-plan.
- **Stratégie de cache** :
  - Tous les assets locaux (JS, CSS, HTML, icônes SVG) sont pré-mis en cache (`globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}']`).
  - Les polices Google Fonts (`fonts.googleapis.com` et `fonts.gstatic.com`) sont mises en cache selon la stratégie `CacheFirst` avec une expiration à 1 an.

---

## 2. Manifest Web App

- **ID** : `/`
- **Nom complet** : `Animor — Studio d'animation de données`
- **Nom court** : `Animor` (≤ 12 caractères)
- **Start URL & Scope** : `/`
- **Display** : `standalone`
- **Thème système & barre de statut** : `#090d16`
- **Icônes** : SVG haute définition et compatibilité Chromium / Android / iOS.

---

## 3. Installation In-App & Détection Hors-Ligne

- **Bouton d'installation intégré (`PWAInstallButton`)** :
  - Sur Chrome / Edge / Android : Écoute de l'événement `beforeinstallprompt` et déclenchement direct du prompt natif.
  - Sur iOS Safari : Détection de la plateforme et affichage d'un guide étape par étape (Bouton Partage > Sur l'écran d'accueil).
  - Masquage automatique lorsque l'application s'exécute déjà en mode autonome (`standalone`).
- **Indicateur de statut hors-ligne (`OfflineIndicator`)** :
  - Un badge discret s'affiche dès que la connexion internet est interrompue, rassurant l'utilisateur sur le fait qu'Animor opère sans aucun souci 100% hors-ligne.
