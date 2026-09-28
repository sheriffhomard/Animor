# Feuille de Route (Roadmap) — Animor

Ce document décrit les orientations techniques et fonctionnelles pour les futures itérations du projet.

---

## 📌 Version 1.0 (Actuelle)
- [x] Import Excel (.xlsx) et détection multi-feuilles
- [x] Import CSV (séparateurs auto-détectés : `,`, `;`, `\t`)
- [x] Copier/coller direct depuis Excel (presse-papier)
- [x] Saisie et édition manuelle du tableau (1 à 10 lignes)
- [x] Exactement 2 colonnes (Label / Valeur)
- [x] Support des valeurs positives, nulles et négatives
- [x] 3 modes de visualisation : Barres horizontales, Classement animé, Bulles
- [x] Moteur d'animation indépendant avec Easing (Linear, Ease In, Ease Out, Ease In Out)
- [x] Timeline complète (Play, Pause, Restart, Scrubber, Vitesse, Boucle)
- [x] Personnalisation des styles (thèmes, polices, formats 16:9, 1:1, 9:16)
- [x] Exports : WebM (vidéo), SVG (vecteur), PNG (HD), HTML autonome
- [x] Sauvegarde locale via IndexedDB (sans compte ni serveur)
- [x] Progressive Web App (PWA) installable et 100% offline
- [x] Suite complète de tests unitaires Vitest

---

## 🚀 Version 1.1
- [ ] Export MP4 natif côté client (via WebCodecs ou transcodeur léger)
- [ ] Résolutions 4K (3840×2160)
- [ ] Modèles graphiques et presets éditoriaux pré-enregistrés
- [ ] Enregistrement multi-scènes basique (succession de 2 à 3 graphiques)
- [ ] Import et intégration de logos ou icônes personnalisées par barre

---

## 🔮 Version 2.0
- [ ] **Données temporelles** : Bar Chart Race complet (évolution multi-dates / multi-années)
- [ ] **Multi-séries** : Comparaison de plusieurs métriques sur le même graphique
- [ ] **Capacité étendue** : Au-delà de 10 lignes avec scrolling ou fenêtrage dynamique
- [ ] **Nouveaux types de graphiques** :
  - Line Chart animé
  - Nuage de points (Scatter Plot)
  - Cartes géographiques animées
- [ ] **Studio Audio & Narration** : Pistes sonores d'ambiance et synchronisation vocale
- [ ] **Transitions cinématographiques** entre scènes multiples
- [ ] **Composant Embed Web** : Intégration iframe responsive et widget interactif
