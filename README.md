# Animor — Studio d'animation de données (V1)

**Animor** est une application web et Progressive Web App (PWA) conçue pour transformer un petit jeu de données issu d'un fichier Excel (.xlsx) ou CSV en une visualisation animée, fluide et exportable (WebM, SVG, PNG, HTML autonome).

Conçue selon une philosophie **100% Local-First**, Animor fonctionne entièrement dans votre navigateur, sans backend, sans compte utilisateur, et sans transmission de vos données sur un serveur distant.

---

## 🚀 Fonctionnalités Clés

* **Import polyvalent** :
  * Glisser-déposer de fichiers **Excel (.xlsx)** avec sélection interactive de feuille si plusieurs feuilles sont présentes.
  * Glisser-déposer de fichiers **CSV** avec détection automatique du séparateur (virgule `,`, point-virgule `;`, tabulation `\t`).
  * Collage direct depuis le presse-papier (**Ctrl+V**) avec aperçu immédiat.
  * Éditeur manuel intégré (ajout, modification, suppression de lignes).
* **Validation stricte V1** :
  * Exactement 2 colonnes (Label et Valeur).
  * 1 à 10 lignes maximum.
  * Détection d'en-tête, des valeurs numériques (valeurs négatives et nulles pleinement prises en charge), des cellules vides, de NaN/Infinity et des doublons de labels.
* **Moteur d'animation fluide** :
  * 3 modes de rendu : **Barres horizontales**, **Classement animé (Ranking)**, **Bulles proportionnelles**.
  * Interpolation géométrique et temporelle basée sur `requestAnimationFrame`.
  * Courbes d'atténuation (Easing) : *Linear*, *Ease In*, *Ease Out*, *Ease In Out*.
  * Timeline interactive avec Scrubber, Lecture / Pause, Recommencer, Boucle, Vitesse réglable (0.5x, 1x, 1.5x, 2x).
* **Personnalisation & Design Studio** :
  * Formats multiples : 16:9 (1920x1080), 1:1 (1080x1080), 9:16 (1080x1920).
  * Palettes pré-définies (*Cyber Indigo, Sunset Coral, Emerald Neo, Editorial Luxury, Technical Terminal, Clean Light*) et sélecteurs de couleurs personnalisés.
  * Typographie configurable (*Plus Jakarta Sans, JetBrains Mono, Playfair Display, System UI*).
  * Titre, sous-titre et source personnalisables.
* **Multi-Export local** :
  * **Vidéo WebM** haute fidélité (30 FPS) capturée localement via `MediaRecorder` et `canvas.captureStream`.
  * **Vecteur SVG** autonome sans perte.
  * **Image PNG** haute résolution.
  * **Fichier HTML autonome** avec mini-lecteur intégré partageable sans serveur.
* **Sauvegarde & PWA** :
  * Gestionnaire de projets locaux stockés dans **IndexedDB** (aucun cloud requis).
  * Installable sur desktop, Android et iOS.
  * Cache Service Worker complet garantissant un fonctionnement hors-ligne absolu.

---

## 🛠️ Stack Technique

* **Framework** : React 19 + TypeScript + Vite 8
* **Styling** : Tailwind CSS v4 + Lucide Icons + Motion
* **Lecture Excel** : SheetJS / `xlsx`
* **Moteur Graphique** : Moteur SVG et Animation mathématique maison
* **Stockage** : IndexedDB API
* **PWA** : `vite-plugin-pwa` + Service Worker Workbox
* **Tests** : Vitest

---

## 📦 Installation et Développement

### Prérequis
* Node.js 18+ ou Bun

### Démarrage
```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement (Port 3000)
npm run dev

# Exécution des tests unitaires
npm test

# Validation TypeScript / Linter
npm run lint

# Build de production
npm run build
```

---

## 🎯 Limites de la Version 1 (V1)

1. **Exactement 2 colonnes logiques** : Première colonne = Label (texte), Deuxième colonne = Valeur (nombre).
2. **Capacité** : 1 ligne minimum, 10 lignes maximum.
3. **Format Vidéo** : Export vidéo V1 en WebM natif (supporté par Chrome, Firefox, Edge).

---

## 📚 Documentation Détaillée

Consultez le dossier [`docs/`](./docs/) pour les spécifications techniques complètes :
* [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) : Vue d'ensemble du système et flux de données
* [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) : Modèles `Dataset`, `Project`, `Theme`
* [`docs/ANIMATION_ENGINE.md`](./docs/ANIMATION_ENGINE.md) : Moteur d'interpolation et Easing
* [`docs/RENDERING.md`](./docs/RENDERING.md) : Architecture de rendu SVG
* [`docs/IMPORT_FORMATS.md`](./docs/IMPORT_FORMATS.md) : Spécifications CSV, Excel & Presse-papier
* [`docs/EXPORT.md`](./docs/EXPORT.md) : Fonctionnement des exports WebM, SVG, PNG & HTML
* [`docs/PWA.md`](./docs/PWA.md) : Offline-first, Manifest et Service Worker
* [`docs/TESTING.md`](./docs/TESTING.md) : Stratégie et exécution des tests Vitest
* [`docs/ROADMAP.md`](./docs/ROADMAP.md) : Évolutions prévues (V1.1 et V2)
