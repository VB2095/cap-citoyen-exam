# Cap Citoyen

Application de révision de l’examen civique pour la naturalisation française, développée avec React, TypeScript et Vite.

## Fonctionnalités

- 258 questions de connaissance couvrant intégralement la liste officielle publiée pour la naturalisation
- 16 mises en situation pédagogiques originales, clairement identifiées
- flashcards avec quatre niveaux d’autoévaluation et répétition espacée
- statuts « nouvelle », « en apprentissage », « à consolider » et « maîtrisée »
- bloc « Piège fréquent » en français et en anglais
- explications pédagogiques contextualisées, consultables en français ou en anglais
- liens d’approfondissement vers Wikipédia, distincts des sources officielles
- entraînements QCM de 5, 10 ou 20 questions
- examen blanc de 40 questions en 45 minutes
- répartition conforme à l’arrêté du 10 octobre 2025
- progression conservée dans `localStorage`
- thème clair et sombre
- application web installable (PWA) avec fonctionnement hors connexion
- bouton d’installation directe sur les navigateurs compatibles et aide dédiée sur iPhone/iPad
- vérification immédiate des mises à jour, notification avant installation et confirmation après activation
- indicateur de connexion et interface adaptée aux zones sûres des appareils mobiles
- interface responsive et utilisable au clavier

## Prévisualisation locale

Prérequis : Node.js 22.18 ou une version ultérieure.

```bash
npm install
npm run dev
```

La commande affiche l’adresse locale à ouvrir dans le navigateur. Les fonctions PWA complètes nécessitent une prévisualisation de production ou un hébergement HTTPS :

```bash
npm run build
npm run preview
```

Autres commandes utiles :

```bash
npm test
```

## Déploiement

Le projet est configuré pour Netlify dans `netlify.toml` :

- commande de build : `npm run build` ;
- dossier publié : `dist` ;
- version de Node.js : 22 ;
- redirection des routes vers `index.html` pour React Router.

La PWA et son service worker sont générés automatiquement pendant le build.


## Mise à jour éditoriale

La banque officielle se trouve dans `official-bank.js`. Les intitulés viennent du ministère de l’Intérieur. Les réponses sont des propositions pédagogiques indépendantes de leqcmcivique.fr, réutilisées sous Licence Ouverte 2.0 avec attribution. Les QCM et mises en situation complémentaires se trouvent dans `questions.js`. La couche pédagogique et les associations avec le glossaire se trouvent dans `src/knowledge-engine.js`.
