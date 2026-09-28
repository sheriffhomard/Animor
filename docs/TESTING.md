# Stratégie de Test — Animor

## 1. Environnement de Test

Animor utilise **Vitest** comme exécuteur de tests ultra-rapide compatible avec la configuration TypeScript et Vite du projet.

Pour exécuter la suite de tests :
```bash
npm test
```

---

## 2. Couverture des Tests Unitaires

La suite de tests principale se trouve dans `src/__tests__/animor.test.ts` et valide de manière isolée chaque composant critique :

1. **Parseur CSV** :
   - Détection des virgules (`,`), points-virgules (`;`) et tabulations (`\t`).
   - Gestion des accents UTF-8.
   - Préservation des champs encadrés de guillemets contenant des délimiteurs internes.
   - Robustesse face aux chaînes vides ou malformées.
2. **Parseur Excel** :
   - Lecture de classeurs réels générés en mémoire avec SheetJS.
   - Extraction des noms de feuilles et normalisation des lignes.
3. **Validateur de Données** :
   - Acceptation des jeux conformes (2 colonnes, 1 à 10 lignes).
   - Rejet immédiat si plus de 2 colonnes ou moins de 2 colonnes.
   - Rejet si plus de 10 lignes (limite V1).
   - Détection des chaînes non numériques (NaN, Infinity).
   - Validation des nombres négatifs et nuls.
   - Avertissement explicite sur les doublons de libellés.
4. **Normaliseur de Données** :
   - Génération des identifiants uniques de ligne.
   - Conversion des séparateurs décimaux français (virgule `82,5` en `82.5`).
5. **Fonctions d'Easing** :
   - Contrôle des bornes $f(0) = 0$ et $f(1) = 1$.
   - Évaluation à mi-parcours ($t = 0.5$).
6. **Moteur d'Animation (`AnimationEngine`)** :
   - Vérification de l'état initial ($progress = 0$).
   - Vérification de l'interpolation à mi-parcours ($progress = 0.5$).
   - Vérification de la complétude au point final ($progress = 1.0$).
7. **Rendu SVG (`SvgRenderer`)** :
   - Production d'un balisage SVG valide avec `viewBox`, éléments graphiques et textes.
   - Validation des modes Barres, Classement et Bulles.
8. **Export HTML Autonome** :
   - Vérification de la présence de la structure HTML, des métadonnées et du moteur minimal embarqué.
