# Formats d'Import — Animor

## 1. Fichiers Excel (.xlsx)

- Bibliothèque utilisée : `xlsx` (SheetJS).
- La première feuille de calcul est lue par défaut.
- **Support multi-feuilles** : Si le classeur contient plus d'une feuille, une modale de sélection invite l'utilisateur à choisir la feuille souhaitée.
- Lecture des types de cellules natifs (chaînes, nombres, pourcentages).

---

## 2. Fichiers CSV

- Détection automatique du délimiteur d'entrée en analysant les premières lignes :
  - Virgule `,`
  - Point-virgule `;`
  - Tabulation `\t`
- Encodage : UTF-8, prise en compte des caractères accentués français et internationaux.
- Gestion robuste des guillemets doubles et guillemets échappés.
- Nombres : acceptation de la virgule décimale (`82,5`) et du point décimal (`82.5`).

---

## 3. Collage depuis Excel ou Tableur (Presse-papier)

- Raccourci `Ctrl+V` ou bouton "Coller des données".
- Le texte collé issu du presse-papier Excel utilise généralement des tabulations (`\t`) entre colonnes et des retours à la ligne (`\n`).
- Le tokenizer extrait instantanément les colonnes et affiche une prévisualisation de validation avant confirmation par l'utilisateur.

---

## 4. Règles de Validation V1

| Règle | Statut | Comportement si non respecté |
| :--- | :--- | :--- |
| **Colonnes** | Exactement 2 | Message d'erreur explicite |
| **Lignes** | 1 à 10 | Rejet avec message d'erreur si > 10 ou 0 |
| **En-tête** | Obligatoire en ligne 1 | Message d'erreur si absent ou vide |
| **Valeurs numériques** | Positives, négatives, nulles | Rejet si texte non numérique, NaN ou Infinity |
| **Doublons de label** | Autorisés | Alerte d'avertissement affichée |
