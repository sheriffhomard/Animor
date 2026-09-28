# Architecture Globale — Animor

## Principes Directeurs

1. **Local-First & Zéro-Backend** : L'intégralité du traitement de données, de la validation, de l'animation et des rendus s'exécute côté client (dans le navigateur de l'utilisateur). Aucune API tierce, aucune télémétrie et aucune base de données distante.
2. **Découplage Fonctionnel** :
   - Les moteurs de validation, normalisation, parsing, animation mathématique et rendu SVG sont strictement découplés de React.
   - React est employé uniquement comme couche de présentation déclarative (UI), orchestration d'état de projet et liaison d'événements.
3. **Performance à 60 FPS** :
   - La boucle d'animation s'appuie sur `requestAnimationFrame`.
   - Les frames du canvas de prévisualisation mettent à jour le DOM SVG sans provoquer de cascades de réconciliation React à chaque tick (60 fois par seconde).

---

## Schéma d'Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   UTILISATEUR                          │
│     (Fichier XLSX, CSV, Collage Presse-papier, Table)   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                   PARSERS (Phase 1)                    │
│   • csvParser.ts (Détection séparateur, UTF-8, etc.)   │
│   • excelParser.ts (Lecture .xlsx via SheetJS)         │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                  VALIDATOR (Phase 2)                   │
│   • 2 colonnes obligatoires                            │
│   • 1 à 10 lignes                                      │
│   • Valeurs numériques, NaN/Infinity, Doublons         │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                 NORMALIZER (Phase 3)                   │
│   • Conversion vers Dataset uniforme                   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             ANIMATION ENGINE (Indépendant)             │
│   • Courbes d'Easing (linear, easeInOut, etc.)         │
│   • Interpolation : valeurs, positions, opacités       │
│   • API: getStateAt(progress: number): AnimationState  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                  SVG RENDERER                          │
│   • Mode A: Barres horizontales avec axe zéro          │
│   • Mode B: Classement dynamique animé                 │
│   • Mode C: Bulles proportionnelles déterministes      │
│   • Sortie : Chaîne SVG autonome                       │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
    ┌──────────────────────┐   ┌──────────────────────┐
    │  PREVIEW INTERACTIVE │   │   MODULES D'EXPORT   │
    │  • Timeline Scrubber │   │   • WebM (Vidéo)     │
    │  • RequestAnimFrame  │   │   • SVG (Vecteur)    │
    │  • Aspect Ratios     │   │   • PNG (HD Canvas)  │
    └──────────────────────┘   │   • HTML Autonome    │
                               └──────────────────────┘
```
