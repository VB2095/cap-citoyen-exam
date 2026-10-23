# Cap Citoyen

Application statique de révision de l’examen civique pour la naturalisation française.

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
- interface responsive et utilisable au clavier

## Prévisualisation locale

Le projet n’a aucune dépendance. Ouvrir `index.html` directement ou servir ce dossier avec un serveur statique.


## Mise à jour éditoriale

La banque officielle se trouve dans `official-bank.js`. Les intitulés viennent du ministère de l’Intérieur. Les réponses sont des propositions pédagogiques indépendantes de leqcmcivique.fr, réutilisées sous Licence Ouverte 2.0 avec attribution. Les QCM et mises en situation complémentaires se trouvent dans `questions.js`.
