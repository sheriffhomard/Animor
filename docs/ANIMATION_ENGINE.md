# Moteur d'Animation — Animor

## Philosophie

Le moteur `AnimationEngine` est une classe TypeScript pure, sans dépendance avec le DOM ou React.

Son API centrale est :
```typescript
public getStateAt(progress: number): AnimationState
```
où `progress ∈ [0, 1]`.

---

## 1. Découpage Temporel (Timeline Staging)

Pour conférer un rendu studio cinématique, la progression normalisée est découpée en phases coordonnées :

1. **Phase 1 : Fade-in étagé (`0.00 → 0.15`)** :
   Les éléments apparaissent avec un léger décalage (staggering) d'opacité `0 → 1`.
2. **Phase 2 : Croissance & Compteur (`0.05 → 0.85`)** :
   Les valeurs numériques et les longueurs de barres / rayons de bulles croissent selon la courbe d'easing choisie.
3. **Phase 3 : Réordonnancement fluide (`0.15 → 0.85`)** :
   En mode Classement (Mode B), les rangs verticaux interpolent de leur position initiale vers leur rang final trié décroissant.
4. **Phase 4 : Maintien et stabilisation (`0.85 → 1.00`)** :
   L'état final est maintenu stable pour permettre une lecture claire des résultats.

---

## 2. Fonctions d'Easing

Toutes les fonctions sont normalisées sur l'intervalle $[0, 1]$ :

* **Linear** : $f(t) = t$
* **Ease In (Cubic)** : $f(t) = t^3$
* **Ease Out (Cubic)** : $f(t) = 1 - (1 - t)^3$
* **Ease In Out (Cubic)** :
  $$f(t) = \begin{cases} 4t^3 & \text{si } t < 0.5 \\ 1 - \frac{(-2t + 2)^3}{2} & \text{si } t \ge 0.5 \end{cases}$$
