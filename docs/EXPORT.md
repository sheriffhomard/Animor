# Système d'Exportation — Animor

## 1. Export Vidéo WebM

L'export vidéo est réalisé sans serveur grâce aux APIs HTML5 natives :
1. Initialisation d'un élément `<canvas>` offscreen aux dimensions du projet (ex: 1920×1080).
2. Création d'un flux de capture via `canvas.captureStream(fps)` avec 30 images par seconde.
3. Instanciation d'un `MediaRecorder` avec le codec WebM adéquat (`video/webm;codecs=vp9` ou `vp8`).
4. Parcours séquentiel de l'animation de `progress = 0` à `1.0`.
5. Dessin de chaque trame SVG convertie sur le Canvas.
6. Finalisation de l'enregistrement et téléchargement automatique du fichier `.webm`.

*Note de compatibilité* : Si `MediaRecorder` ou `captureStream` ne sont pas supportés par l'environnement du navigateur, un message informatif clair est affiché.

---

## 2. Export Vectoriel SVG

- Génère un fichier SVG autonome incluant les dégradés `<defs>`, les polices et tous les éléments graphiques.
- Choix de la trame exportée : état final (100%) ou position courante du curseur de timeline.
- Utilisable directement dans Illustrator, Figma, Inkscape ou sur le web.

---

## 3. Export Image PNG

- Rendu du SVG sur un Canvas à la résolution exacte du projet.
- Export sans perte avec canal alpha préservé.

---

## 4. Export HTML Autonome

- Fonction `generateStandaloneHtml(project)`.
- Produit un fichier HTML complet contenant les données JSON du projet, le CSS de mise en page et un moteur d'animation minimaliste en JavaScript pur.
- Peut être envoyé par e-mail, partagé sur clé USB ou hébergé sur n'importe quel serveur statique sans aucune installation préalable.
