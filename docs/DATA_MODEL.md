# Modèle de Données — Animor

## 1. Dataset & DataRow

Toutes les données en entrée (qu'elles proviennent d'Excel, de CSV ou d'une saisie manuelle) sont transformées vers une structure normalisée :

```typescript
export interface DataRow {
  id: string;      // Identifiant unique pour le tracking d'animation
  label: string;   // Libellé de l'élément (colonne 1)
  value: number;   // Valeur numérique (colonne 2, positive, nulle ou négative)
}

export interface Dataset {
  labelColumn: string; // Nom de la colonne de labels
  valueColumn: string; // Nom de la colonne de valeurs
  rows: DataRow[];     // Lignes (1 à 10 éléments en V1)
}
```

---

## 2. Configuration d'Animation (`AnimationConfig`)

```typescript
export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
export type ChartMode = 'bars' | 'ranking' | 'bubbles';
export type AspectRatio = '16:9' | '1:1' | '9:16';

export interface AnimationConfig {
  duration: number;        // Durée en secondes (ex: 3)
  easing: EasingType;      // Fonction d'atténuation
  mode: ChartMode;         // 'bars' | 'ranking' | 'bubbles'
  autoplay: boolean;       // Démarrage automatique
  aspectRatio: AspectRatio;// Ratio d'affichage
  loop?: boolean;          // Répétition en boucle
}
```

---

## 3. Thème Graphique (`Theme`)

```typescript
export interface Theme {
  id: string;
  name: string;
  background: string; // Couleur d'arrière-plan du canevas
  primary: string;    // Couleur principale des barres / éléments
  secondary: string;  // Dégradé ou couleur secondaire
  text: string;       // Couleur des typographies
  accent: string;     // Accents et surbrillances
  fontFamily: string; // Police de caractères
  gridColor?: string; // Trame ou lignes de repère
}
```

---

## 4. Projet (`Project`)

```typescript
export interface Project {
  id: string;
  title: string;
  subtitle?: string;
  source?: string;
  dataset: Dataset;
  animation: AnimationConfig;
  theme: Theme;
  createdAt: number;
  updatedAt: number;
}
```
Ce format est persisté directement dans IndexedDB et sert de conteneur d'export pour la fonction `exportStandaloneHtml`.
