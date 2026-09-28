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

## Les 3 Modes de Visualisation

### Mode A : Barres Horizontales
- Chaque ligne du tableau devient une barre horizontale avec coins arrondis (`rx`).
- Prise en charge des valeurs positives et négatives :
  - L'axe zéro est calculé automatiquement à la position relative `zeroRatio`.
  - Les valeurs positives s'étendent vers la droite.
  - Les valeurs négatives s'étendent vers la gauche avec un dégradé distinct.
- Un point scintillant d'extrémité suit l'extrémité de chaque barre en mouvement.

### Mode B : Classement Animé (Ranking)
- Les éléments sont ordonnés selon leur valeur finale décroissante.
- Durant l'animation, chaque ligne glisse verticalement de sa position d'entrée à sa position finale (`currentRank`).
- Un badge numérique stylisé (`#1`, `#2`, etc.) s'affiche à côté de chaque ligne avec mise en exergue du leader.

### Mode C : Bulles Déterministes
- Chaque ligne est représentée par une sphère dont le rayon est proportionnel à la racine carrée de la valeur absolue :
  $$r \propto \sqrt{|v| / v_{\max}}$$
- Disposition déterministe par spirale de Fermat (angle d'or $\approx 137.5^\circ$) centrée dans le canevas. La disposition est 100% reproductible entre les images et les exports.
- Dégradé tridimensionnel avec reflet supérieur pour un effet fluide de bulle de données.

---

## Formats Supportés
- **16:9** : 1920 × 1080 (Format paysage standard, YouTube / TV)
- **1:1** : 1080 × 1080 (Format carré, Instagram / LinkedIn)
- **9:16** : 1080 × 1920 (Format vertical, TikTok / Reels / Stories)
