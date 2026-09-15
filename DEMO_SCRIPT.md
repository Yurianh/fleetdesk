# Script de démonstration — FleetDesk

**Durée visée : 4 min 30.** FleetDesk est le logiciel présenté ; Occitrans
Services est la société fictive dont on montre le compte — 15 véhicules,
12 conducteurs, sur `demo@fleetdesk.fr`. Ne jamais laisser entendre que
FleetDesk *est* le transporteur : c'est l'outil du transporteur.

Les minutages sont des repères, pas un métronome. Le fil conducteur tient en
une phrase, à garder en tête d'un bout à l'autre :

> **On ne montre pas des écrans, on montre une journée de gestionnaire de
> flotte : ce qui brûle, ce qu'on fait, ce qu'on prouve.**

---

## Avant de lancer l'enregistrement

- [ ] Seed rejoué (`supabase/demo_seed.sql`) — les échéances sont relatives au
      jour de tournage, un seed de la veille décale tout d'un jour.
- [ ] Les 3 PDF de `demo-assets/` déposés sur le Renault Master **AB-123-CD**,
      ou gardés de côté si tu filmes le téléversement en direct (recommandé).
- [ ] Session fraîche : se déconnecter puis se reconnecter juste avant de
      lancer l'enregistrement — la chorégraphie d'atterrissage ne joue **qu'une
      fois par session**, et c'est la première image de la vidéo.
- [ ] Fenêtre en 1440×900 minimum, zoom navigateur à 100 %, barre de favoris
      masquée, notifications système coupées.
- [ ] Onglet unique. Une barre d'onglets chargée casse l'effet « produit ».
- [ ] Décider de l'état de l'interrupteur « Recevoir l'email d'échéances »
      (Paramètres → Notifications) : le seed le laisse **coupé**. Voir 3:40.
- [ ] Ouvrir Rapports une fois avant de tourner : si tu enregistres dans les
      premiers jours du mois, le mois courant est presque vide — il vaut mieux
      montrer le mois précédent, et le savoir avant d'être à l'image.

---

## 0:00 — 0:20 · L'ouverture

**À l'écran :** la connexion, puis le tableau de bord qui se pose élément par
élément.

> « FleetDesk, c'est le logiciel qui tient votre flotte. Voici le compte d'une
> société de transport toulousaine qui l'utilise : quinze véhicules, douze
> conducteurs. On est lundi matin — et la première chose qu'un gestionnaire
> veut savoir, c'est ce qui va lui poser problème cette semaine. »

**Ne rien cliquer pendant l'animation.** Elle dure un peu plus de quatre
secondes, les derniers éléments arrivant en dernier : laisse-la finir, c'est la
seule fois où elle joue.

---

## 0:20 — 1:10 · Le tableau de bord : ce qui brûle

**À l'écran :** rester sur le tableau de bord. Curseur lent, une zone à la fois.

1. **La pastille « 2 alertes actives »**, en haut à droite.

   > « Deux alertes actives. Pas un chiffre décoratif : chacune correspond à
   > une échéance qui tombe. »

2. **Le panneau Alertes, à droite.** Le pointer de haut en bas.

   > « Contrôle technique du Renault Master dans cinq jours — action
   > immédiate. Peugeot Boxer dans vingt-deux jours, celui-là je le note.
   > Révision du Master dans neuf mille six cents kilomètres. »

   > « Et en bas, les conducteurs : le casier judiciaire de Pierre Dubois a
   > expiré il y a huit jours — celui-là, j'y vais tout de suite. La visite
   > médicale de Sophie Renard tombe dans vingt et un jours, je la note. »

   **Point à faire entendre :** la couleur n'est pas là pour faire peur.
   L'ambre signale ce qui demande une action, le gris ce qu'on surveille. Rien
   n'est rouge — le rouge est réservé à ce qu'on supprime.

3. **Les quatre compteurs** (Véhicules, Conducteurs, Affectations, Problèmes).

   > « Quinze véhicules, douze affectés. Trois volants libres : c'est normal,
   > une flotte garde de la réserve. »

4. **« Utilisation des véhicules »**, le graphe central.

   > « Le kilométrage parcouru sur les trois derniers mois. Je vois tout de
   > suite qui tourne — le Fiat Ducato à douze mille six cents kilomètres — et
   > qui dort : le Toyota Proace à mille cent. »

   Cliquer sur **« Afficher : Plaque »** et choisir **Conducteur**.

   > « Et si je raisonne en conducteurs plutôt qu'en plaques, c'est le même
   > graphe vu autrement. »

   **Ne pas changer la période** (3 mois → 6 mois → 1 an) : l'historique du
   compte ne couvre que trois mois, les barres ne bougeraient pas.

---

## 1:10 — 1:50 · L'alerte jusqu'au bout

**Le moment le plus important de la vidéo.** On ne montre pas une alerte, on
montre qu'elle mène quelque part.

On prend **Pierre Dubois** et non Sophie Renard : son casier judiciaire est
expiré (le niveau d'alerte le plus fort) et ce document a une durée de validité
d'un an, donc l'échéance se recalcule toute seule à l'écran. La visite médicale
de Sophie, elle, se saisit à la main — moins démonstratif.

1. Cliquer sur **« Pierre Dubois — Casier judiciaire »** dans le bloc
   « Documents expirés ».

2. La fiche conducteur s'ouvre, **défile jusqu'à la ligne concernée et la
   souligne** quelques secondes.

   > « Je clique sur l'alerte et j'arrive exactement sur le document qui la
   > déclenche. Pas sur la fiche, pas sur une liste de sept lignes : sur la
   > ligne. »

3. Montrer le compteur **« 6/7 conformes »** et la pastille ambre du casier.

   > « Sept documents réglementaires par conducteur : permis, aptitude à la
   > conduite, casier, SST, TPMR, éco-conduite, visite médicale. Six sont à
   > jour, un a expiré. »

4. Cliquer **« Mettre à jour »**, saisir la date de validation du jour,
   enregistrer.

   > « Je saisis la date du nouveau document. L'échéance se calcule toute
   > seule : le casier est valable un an. »

   **Laisser voir le champ d'échéance se remplir** avant d'enregistrer — c'est
   le détail qui fait comprendre que le logiciel connaît la règle.

5. Remonter : la pastille est passée au vert, le compteur à **7/7**.

**Ne pas revenir au tableau de bord** pour vérifier que l'alerte a disparu :
laisse la démonstration sur ce geste, l'enchaînement se fait tout seul.

## 1:50 — 2:30 · La fiche véhicule

**À l'écran :** Véhicules → **AB-123-CD** (Renault Master).

> « Le véhicule qui était en tête des alertes. »

1. **L'en-tête** : plaque, modèle, mise en circulation, kilométrage courant, et
   les pastilles de documents — carte grise, assurance, licence de transport.

2. **Les documents du véhicule.** Cliquer **Modifier** (crayon), déposer la
   carte grise depuis `demo-assets/`, enregistrer.

   > « Carte grise, assurance, licence de transport. Le fichier est stocké de
   > façon privée : le lien qui l'ouvre n'existe que le temps de l'ouvrir. »

   Cliquer sur **Voir** pour ouvrir le PDF, puis refermer l'onglet.

3. **Les onglets, sous l'en-tête** : Kilométrage · Maintenance · Contrôles
   tech. · Lavages · Affectations.

   > « Toute la vie du véhicule est là, onglet par onglet. »

4. Ouvrir **Contrôles tech.** — le dernier contrôle et son échéance à cinq
   jours, avec l'historique.

5. Ouvrir **Maintenance** — la dernière intervention et la prochaine échéance,
   déduite de l'intervalle du planning.

   > « L'application ne se contente pas d'enregistrer ce qui a été fait : elle
   > en déduit ce qui arrive. Douze mois ou vingt mille kilomètres — le premier
   > des deux atteint déclenche l'alerte. »

**Ne pas ouvrir l'onglet Lavages sur ce véhicule** si tu tournes en début de
mois : les lavages du jeu de démonstration datent de neuf et vingt-six jours,
le plus ancien peut tomber sur le mois précédent.

## 2:30 — 3:00 · Les opérations quotidiennes

**Trois écrans, vite.** C'est le rythme qui compte, pas le détail.

1. **Carburant & Kilométrage.** Saisir un relevé sur un véhicule.

   > « Les relevés arrivent ici. Et les chauffeurs ont leur propre accès, limité
   > à leurs véhicules : ils saisissent leur kilométrage depuis leur téléphone,
   > sans rien voir du reste de la flotte. »

   **On reste sur l'écran du gestionnaire** — l'accès chauffeur est mentionné,
   pas montré : il faudrait se déconnecter, et ça casse le rythme.

2. **Lavages.** Montrer la liste et le total en en-tête.

   > « Vingt-quatre lavages, chacun rattaché à son véhicule et à son
   > conducteur, et le total déjà fait en haut de la page. »

   La page liste **tous** les lavages, pas seulement ceux du mois : c'est dans
   Rapports que la vue mensuelle apparaît. Ne pas dire « ce mois-ci » ici.

3. **Affectations.** Montrer qui conduit quoi.

   > « Douze affectations en cours. Réaffecter un véhicule prend deux clics, et
   > l'historique reste. »

---

## 3:00 — 3:40 · Rapports : ce qu'on prouve

**À l'écran :** Rapports.

**L'écran est mensuel** : un mois à la fois, avec les flèches pour changer de
mois. Ne pas promettre une période libre.

1. **Les compteurs du mois** : distance parcourue, pleins, entretiens.

2. **Dépenses par catégorie** — maintenance, carburant, lavages.

   > « Où part l'argent ce mois-ci, et la comparaison avec le mois précédent. »

3. **Véhicules les plus coûteux.**

   > « Et surtout : sur quel véhicule. C'est la conversation qu'on a en réunion
   > budget, et elle est là, sans tableur. »

4. **Échéances du mois** — contrôles techniques et documents conducteurs.

   > « Et ce qui tombe dans le mois, au même endroit que les dépenses. »

5. **Télécharger le PDF.** Montrer le fichier qui s'ouvre.

   > « Un PDF prêt à envoyer à la direction ou à l'expert-comptable. »

---

## 3:40 — 4:10 · Ce qui tourne sans vous

**À l'écran :** Paramètres → section Notifications.

> « Tout ce que je viens de montrer suppose que j'ouvre l'application. Mais une
> échéance ne tombe pas quand je regarde. »

> « FleetDesk envoie un récapitulatif de ce que la flotte demande dans les
> trente prochains jours : contrôles techniques, documents, entretiens prévus.
> Une fois par semaine — et plus tôt si une échéance passe sous les sept jours.
> L'application vient vous chercher, pas l'inverse. »

Montrer l'interrupteur « Recevoir l'email d'échéances ».

**Sur le compte de démonstration, l'interrupteur est coupé** — le seed le
désactive pour ne pas envoyer d'emails pendant les essais. Deux options : le
dire (« ici je l'ai coupé pour la démonstration »), ou l'activer juste avant de
filmer le plan. Ne pas le laisser visible sans rien en dire, un interrupteur
éteint contredit ce qu'on vient d'annoncer.

---

## 4:10 — 4:30 · La clôture

**À l'écran :** revenir au tableau de bord.

> « Quinze véhicules, douze conducteurs, une matinée de lundi. Les échéances
> sont vues, un document est renouvelé, un rapport est prêt pour la compta. »

> « C'est ce que fait FleetDesk : votre flotte tient dans un écran, et ce qui
> compte vient vous chercher. »

Fin sur le tableau de bord, curseur immobile deux secondes avant de couper.

---

## Ce qu'il ne faut pas faire à l'écran

- **Ne pas ajouter un contrôle technique en direct sur un véhicule en alerte.**
  Le centre d'alertes ne dédoublonne pas les contrôles par véhicule : l'alerte
  reste affichée, et ça se voit.
- **Ne pas changer la période du graphe d'utilisation.** Le compte n'a que
  trois mois de relevés : 6 mois et 1 an affichent exactement les mêmes barres,
  et un sélecteur qui ne change rien se remarque.
- **Ne pas ouvrir les documents des 14 autres véhicules** : seul AB-123-CD a
  ses pièces jointes. Sur les autres, les pastilles affichent « Ajouter », ce
  qui est réaliste mais casse le rythme si on tombe dessus par hasard.
- **Ne pas recharger la page** pendant l'enregistrement : la chorégraphie
  d'atterrissage ne rejoue pas, et un chargement nu se voit.
- **Ne pas s'attarder sur les paramètres de suppression de compte.**

---

## Variantes d'accroche par secteur

À poser en ouverture, à la place de la première phrase, selon l'audience.

**Transport de marchandises**
> « Une licence de transport périmée, c'est un véhicule immobilisé et une
> amende. Voilà comment on ne l'oublie plus. »

**Transport de personnes / TPMR**
> « Aptitude à la conduite, visite médicale, formation TPMR : trois documents
> par conducteur qui expirent à des dates différentes, douze conducteurs. »

**BTP**
> « Vos véhicules sont sur les chantiers, pas au bureau. Le kilométrage se
> saisit depuis le téléphone, et vous, vous voyez la flotte. »

**Artisan / petite flotte**
> « Cinq véhicules, ça tient dans un tableur — jusqu'au jour où un contrôle
> technique passe à travers. »
