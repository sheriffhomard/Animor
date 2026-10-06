# Système de Rendu SVG — Animor

## Architecture du Renderer

L'interface de rendu est définie par :
```typescript
export interface ChartRenderer {
  renderToSvgString(state: AnimationState, config: RenderConfig): string;
}
```

La classe `SvgRenderer` implémente ce contrat et génère des chaînes SVG conformes aux standards XML.

---

## Modes de Visualisation & Règles d'Animation

### 1. Barres Horizontales (`bars`)
- Chaque ligne devient une barre horizontale avec coins arrondis (`rx`).
- Prise en charge des valeurs positives et négatives avec calcul automatique du zéro relatif.
- Compteur de valeur en direct et étincelle d'extrémité animée.

### 2. Classement Animé (`ranking`)
- Réordonnancement dynamique vertical basé sur la valeur instantanée (Bar Chart Race).
- Badges de classement stylisés (`#1`, `#2`, etc.) et mise en valeur du leader.

### 3. Bulles Proportionnelles (`bubbles`)
- Sphères proportionnelles à la racine de la valeur absolue avec reflet tridimensionnel.
- Disposition déterministe via la spirale dorée de Fermat (angle d'or $\approx 137.5^\circ$).

### 4. Courbes (`lines`)
- Tracé continu avec support de lissage cubique Bézier (`curveType: 'smooth'`) ou linéaire (`curveType: 'linear'`).
- Animation progressive du trait via `stroke-dasharray` et `stroke-dashoffset`.
- Puces de données interactives avec halo lumineux et étiquettes de valeurs.
- Support multi-courbes avec légende et palette harmonieuse.

### 5. Aires (`area`)
- Courbes avec remplissage en dégradé descendant vers la ligne de base.
- Opacité configurable (`areaOpacity`: 20% à 75%).
- Révélation progressive horizontale synchronisée sur la timeline.

### 6. Graphiques Empilés (`stacked_bars`)
- Colonnes décomposées en segments cumulés pour comparer les contributions relatives.
- Mode de cumul : Valeurs réelles absolues (`stackedMode: 'absolute'`) ou normalisation 100% (`stackedMode: 'percent'`).
- Animation d'élévation successive des segments et affichage du total cumulé au sommet.

### 7. Diagrammes Circulaires Animés (`pie`)
- Format Anneau Donut (`pieStyle: 'donut'`) avec ratio central personnalisable (35% à 70%) ou disque plein (`pieStyle: 'pie'`).
- Déroulement angulaire fluide de 0° à 360° synchronisé sur la timeline.
- Valeur totale affichée au centre de l'anneau et légende latérale avec pourcentages instantanés.

### 8. Nuages de Points (`scatter`)
- Dispersion des points de données avec échelle ajustable (`scatterPointScale`).
- Apparition avec effet pop-in étagé.
- Ligne de tendance de régression linéaire ($y = mx + b$) dessinée dynamiquement.

### 9. Graphiques Combinés (`combo`)
- Superposition synchronisée : colonnes verticales pour la première série et courbe de tendance animée pour la seconde série avec points d'ancrage.

---

## Formats Supportés
- **16:9** : 1920 × 1080 (Format paysage standard, YouTube / TV)
- **1:1** : 1080 × 1080 (Format carré, Instagram / LinkedIn)
- **9:16** : 1080 × 1920 (Format vertical, TikTok / Reels / Stories)
