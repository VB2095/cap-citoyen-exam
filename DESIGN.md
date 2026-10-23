---
name: Cap Citoyen
description: Un cahier civique numérique, sobre et accessible, inspiré du DSFR.
colors:
  republic-blue: "#000091"
  republic-blue-hover: "#1212ff"
  republic-blue-soft: "#ececfe"
  focus-blue: "#0a76f6"
  alert-red: "#e1000f"
  success-green: "#18753c"
  success-green-soft: "#b8fec9"
  warning-orange: "#b34000"
  warning-orange-soft: "#fee9e6"
  ink: "#161616"
  muted-ink: "#666666"
  border: "#dddddd"
  surface: "#ffffff"
  surface-subtle: "#f6f6f6"
  official-ink: "#0b3b20"
  training-soft: "#feecc2"
  training-ink: "#695240"
  dark-republic-blue: "#8585f6"
  dark-republic-blue-hover: "#b1b1ff"
  dark-republic-blue-soft: "#272747"
  dark-alert-red: "#ff6f7a"
  dark-ink: "#f5f5fe"
  dark-muted-ink: "#cecece"
  dark-surface: "#1e1e1e"
  dark-surface-subtle: "#2a2a2a"
  dark-success-green: "#3bea7e"
  dark-success-green-soft: "#164a2b"
  dark-warning-orange: "#ffb7a5"
  dark-warning-orange-soft: "#5e271a"
  dark-training-soft: "#5e450a"
typography:
  display:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "clamp(2.1rem, 5vw, 3.8rem)"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "clamp(1.6rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.025em"
  mobile-display:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "clamp(1.9rem, 10vw, 2.6rem)"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.025em"
  lead:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "clamp(1.08rem, 2vw, 1.3rem)"
    fontWeight: 400
    lineHeight: 1.55
  hero-metric:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "4rem"
    fontWeight: 700
    lineHeight: 1
  score:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "2.2rem"
    fontWeight: 700
    lineHeight: 1.18
  stat:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 700
    lineHeight: 1.18
  section-title:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.18
  question:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "clamp(1.35rem, 3vw, 1.85rem)"
    fontWeight: 700
    lineHeight: 1.18
  title:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 700
    lineHeight: 1.18
  body:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "0.86rem"
    fontWeight: 700
    lineHeight: 1.35
  answer:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 700
    lineHeight: 1.45
  explanation:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 400
    lineHeight: 1.65
  brand:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
    lineHeight: 1.2
  body-compact:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.55
  meta:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.55
  eyebrow:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "0.08em"
  supporting:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.45
  micro:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 700
    lineHeight: 1.3
  caption:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
  mobile-nav:
    fontFamily: "Marianne, Arial, Helvetica, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    lineHeight: 1.15
rounded:
  square: "0"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  section: "4.5rem"
components:
  button-primary:
    backgroundColor: "{colors.republic-blue}"
    textColor: "{colors.surface}"
    rounded: "{rounded.square}"
    padding: "0.65rem 1rem"
    height: "44px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.republic-blue}"
    rounded: "{rounded.square}"
    padding: "0.65rem 1rem"
    height: "44px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "0.75rem 2.75rem 0.75rem 0.85rem"
    height: "48px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "1.5rem"
---

# Design System: Cap Citoyen

## Overview

**Creative North Star: "Le Cahier civique"**

Cap Citoyen doit ressembler à un outil public de confiance que l’on peut annoter mentalement et reprendre chaque jour. L’interface est directe, structurée et rassurante : elle privilégie le contenu pédagogique, la progression et la réussite de la tâche plutôt que la décoration.

Le langage visuel s’inspire fortement du DSFR sans revendiquer une conformité officielle. Les surfaces restent plates, les angles sont droits, le bleu républicain structure les actions et les couleurs sémantiques n’apparaissent que pour signaler un état réel.

**Key Characteristics:**

- Une hiérarchie éditoriale nette et lisible.
- Des commandes tactiles généreuses et des parcours utilisables au clavier.
- Une palette républicaine sobre, compatible avec les thèmes clair et sombre.
- Des composants carrés, plats et séparés par l’espace avant la bordure.

## Colors

La palette associe un bleu républicain immédiatement identifiable à des surfaces neutres et à trois couleurs sémantiques réservées aux états de réussite, d’avertissement et d’erreur.

### Primary

- **Bleu République** (`republic-blue`) : actions principales, navigation active, liens et repères de progression.
- **Bleu République interactif** (`republic-blue-hover`) : état de survol des actions principales.
- **Voile bleu civique** (`republic-blue-soft`) : fond d’état sélectionné et mise en contexte pédagogique.

### Secondary

- **Vert réussite** (`success-green`) : réponse juste, maîtrise et validation.
- **Orange vigilance** (`warning-orange`) : piège pédagogique, temps faible et information à surveiller.
- **Rouge alerte** (`alert-red`) : erreur, réponse incorrecte et action destructive.

### Neutral

- **Encre principale** (`ink`) : texte et contours forts.
- **Encre secondaire** (`muted-ink`) : métadonnées et textes de soutien.
- **Papier** (`surface`) : fond principal et composants interactifs.
- **Papier secondaire** (`surface-subtle`) : regroupements et surfaces de soutien.
- **Filet neutre** (`border`) : séparateurs et limites de composants.

**The Semantic Color Rule.** Le vert, l’orange et le rouge ne décorent jamais : ils communiquent toujours un état ou une conséquence.

## Typography

**Display Font:** Marianne, avec Arial, Helvetica puis sans-serif comme alternatives.

**Body Font:** Marianne, avec Arial, Helvetica puis sans-serif comme alternatives.

**Character:** une typographie administrative claire et familière, avec une hiérarchie forte mais sans effets expressifs. Arial constitue l’alternative attendue lorsque Marianne n’est pas distribuée.

### Hierarchy

- **Display** (`display`) : titre principal de page, limité à une ligne de lecture courte quand l’espace le permet.
- **Headline** (`headline`) : titres de sections et résultats structurants.
- **Title** (`title`) : titres de cartes, questions et sous-sections.
- **Body** (`body`) : contenu pédagogique, avec une mesure cible de 65 à 75 caractères.
- **Label** (`label`) : libellés de champs, statuts et métadonnées courtes.

**The Reading First Rule.** La taille et l’interligne servent d’abord la compréhension des questions et des explications ; aucun texte essentiel ne descend sous 1rem.

## Layout

Le contenu occupe un conteneur central de 1200px maximum, avec un rythme fondé sur les tokens d’espacement observés. Les pages de lecture et les questionnaires peuvent se resserrer à 860px afin de préserver une mesure confortable.

Sous 800px, la navigation principale passe en barre inférieure et les compositions complexes se replient progressivement. Sous 540px, les cartes, actions et champs deviennent pleine largeur. Tout élément flex ou grid susceptible de contenir du texte doit pouvoir rétrécir avec `min-width: 0`, et le parcours doit rester utilisable avec un texte agrandi à 200 %.

**The Reflow Rule.** Aucun choix, champ ou contenu pédagogique ne doit imposer un défilement horizontal à partir de 320px de largeur.

## Elevation & Depth

Le système est plat par défaut. Les bordures, les aplats et l’espacement organisent les niveaux ; les ombres sont réservées aux éléments temporairement élevés, comme une carte interactive au survol, une notification ou un dialogue.

### Shadow Vocabulary

- **Élévation fonctionnelle** (`--shadow`) : ombre diffuse employée uniquement lorsqu’un composant passe au-dessus du flux courant.
**The Flat by Default Rule.** Une surface au repos utilise soit une bordure, soit un fond distinct ; l’ombre signale une élévation ou une signature explicite.

## Shapes

Les angles restent droits (`square`) afin de conserver un caractère institutionnel proche du DSFR. Les cercles sont réservés aux indicateurs qui portent un sens — icône de thème ou score — et ne deviennent pas une forme de conteneur générique.

Les accents colorés épais se placent au-dessus des blocs importants plutôt que sur leurs côtés, afin de réduire le bruit visuel dans les explications imbriquées.

## Components

### Buttons

- **Shape:** angles droits, avec une hauteur tactile minimale de 44px.
- **Primary:** fond Bleu République, texte clair, graisse forte et ombre intérieure discrète.
- **Hover / Focus:** changement de bleu au survol et contour de focus bleu clair visible.
- **Secondary / Ghost:** fond transparent ; la variante secondaire conserve le Bleu République, la variante fantôme utilise l’encre et le filet neutre.

### Chips

- **Style:** petits aplats sémantiques sans rayon, avec un libellé court et gras.
- **State:** ils décrivent l’origine ou le type d’une question ; ils ne déclenchent pas d’action.

### Cards / Containers

- **Corner Style:** angles droits.
- **Background:** Papier ou Papier secondaire selon le niveau.
- **Shadow Strategy:** aucune ombre au repos ; les bordures et les aplats structurent les cartes.
- **Border:** filet neutre et accent supérieur uniquement lorsqu’il porte un thème ou un état.
- **Internal Padding:** de `md` à `lg` selon la densité du contenu.

### Inputs / Fields

- **Style:** fond Papier, bordure d’encre, hauteur minimale de 48px et largeur fluide.
- **Focus:** contour bleu clair visible, séparé du composant.
- **Error / Disabled:** l’erreur utilise le Rouge alerte ; un état désactivé reste lisible mais visuellement atténué.

### Navigation

Sur écran large, les liens forment une navigation horizontale avec soulignement inférieur de l’élément actif. Sur mobile, ils deviennent une barre inférieure persistante avec icône, libellé et accent supérieur sur l’onglet actif.

### Flashcard

La flashcard est la surface signature : une question centrée, une réponse révélée dans le même contexte et une évaluation explicite. Après chaque action qui remplace son contenu, le focus suit la nouvelle information sans déplacer brutalement la page.

## Do's and Don'ts

### Do:

- **Do** utiliser l’espace et la hiérarchie typographique avant d’ajouter une nouvelle bordure.
- **Do** conserver des cibles tactiles d’au moins 44px pour les contrôles autonomes.
- **Do** gérer explicitement le focus après chaque remplacement dynamique d’une question ou d’une réponse.
- **Do** vérifier chaque composant dans les thèmes clair et sombre ainsi qu’avec un texte agrandi à 200 %.

### Don't:

- **Don't** présenter Cap Citoyen comme un service officiel ou comme une implémentation certifiée du DSFR.
- **Don't** placer `aria-live` sur la totalité d’une page ou d’un parcours interactif.
- **Don't** empiler des bordures latérales colorées dans une même carte pédagogique.
- **Don't** utiliser une largeur fixe ou une largeur minimale qui empêche le reflow du texte.
