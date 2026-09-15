# Script de démonstration — FleetDesk

**Durée visée : 4 min 30.** FleetDesk est le logiciel présenté. Occitrans
Services est la société fictive dont on montre le compte — 15 véhicules,
12 chauffeurs, sur `demo@fleetdesk.fr`. Ne jamais laisser entendre que
FleetDesk *est* le transporteur : c'est l'outil du transporteur.

## La voix

**Tonalité opérateur.** Tu parles à un gars qui gère quinze camions et qui se
méfie de ce qui brille. Débit normal, phrases courtes, pas d'emphase. La
crédibilité vient du vocabulaire juste, pas de l'énergie.

- **Le CT**, jamais « le contrôle technique » à l'oral.
- **Un chauffeur**, pas « un conducteur » — l'écran écrit conducteur, toi tu
  dis chauffeur.
- **La carte grise**, **la licence**, **la visite médicale**, **le casier**.
- **Des bornes** ou des kilomètres, dits à voix haute : « douze mille six
  cents », pas « 12 614 ».

**Ne décris pas ce que fait le curseur.** Le spectateur le voit. Tu dis
pourquoi, pas quoi.

**Laisse du blanc.** Les silences notés dans le script ne sont pas des trous,
c'est là que le spectateur regarde l'écran. Si tu remplis tout, ça sonne faux.

**Une seule vraie phrase de conclusion**, tout à la fin. Pas une par section.

---

## Avant de lancer l'enregistrement

- [ ] Seed rejoué (`supabase/demo_seed.sql`) — les échéances sont relatives au
      jour de tournage, un seed de la veille décale tout d'un jour.
- [ ] Les 3 PDF de `demo-assets/` sous la main pour le téléversement en direct.
- [ ] Session fraîche : se déconnecter, se reconnecter juste avant de lancer.
      La chorégraphie d'atterrissage ne joue **qu'une fois par session**, et
      c'est la première image de la vidéo.
- [ ] Fenêtre en 1440×900 minimum, zoom à 100 %, favoris masqués,
      notifications système coupées.
- [ ] Onglet unique.
- [ ] Décider de l'état de l'interrupteur « Recevoir l'email d'échéances »
      (Paramètres → Notifications) : le seed le laisse **coupé**. Voir 3:40.
- [ ] Ouvrir Rapports une fois avant de tourner. Si tu enregistres dans les
      premiers jours du mois, le mois courant est presque vide — mieux vaut
      montrer le mois précédent, et le savoir avant d'être à l'image.

---

## 0:00 — 0:20 · L'ouverture

**À l'écran :** la connexion, puis le tableau de bord qui se pose.

> « FleetDesk, c'est le logiciel qui tient le parc. Là c'est le compte d'un
> transporteur toulousain. Quinze véhicules, douze chauffeurs. »

**[silence — laisser l'animation finir]**

> « On est lundi matin. Première question : qu'est-ce qui me tombe dessus cette
> semaine. »

**Ne rien cliquer pendant l'animation.** Un peu plus de quatre secondes, les
derniers éléments arrivent en dernier. C'est la seule fois où elle joue.

---

## 0:20 — 1:10 · Le tableau de bord

**À l'écran :** on reste. Curseur lent, une zone à la fois.

1. La pastille **« 2 alertes actives »**, en haut à droite.

   > « Deux alertes. »

2. **Le panneau Alertes**, à droite. Descendre lentement.

   > « Le CT du Master saute dans cinq jours. Le Boxer, vingt-deux jours,
   > celui-là je le note. Révision du Master dans neuf mille six cents
   > bornes. »

   **[silence 2 s]**

   > « Et les chauffeurs. Le casier de Pierre Dubois est périmé depuis huit
   > jours. La visite médicale de Sophie Renard tombe dans trois semaines. »

   **Sur la couleur, ne rien expliquer.** Si quelqu'un demande plus tard :
   l'ambre appelle une action, le gris se surveille, le rouge est réservé à ce
   qu'on supprime. Mais ne le dis pas à l'image — ça se voit.

3. **Les quatre compteurs.**

   > « Quinze véhicules, douze affectés. Trois qui tournent pas cette
   > semaine. »

4. **« Utilisation des véhicules »**, le graphe.

   > « Le kilométrage sur trois mois. Le Ducato, douze mille six cents. Le
   > Proace, mille cent. »

   **[silence 2 s]**

   Cliquer **« Afficher : Plaque »**, choisir **Conducteur**.

   > « Ou par chauffeur, si c'est comme ça que tu raisonnes. »

   **Ne pas toucher au sélecteur de période.** Le compte n'a que trois mois de
   relevés : 6 mois et 1 an donnent les mêmes barres.

---

## 1:10 — 1:50 · L'alerte jusqu'au bout

**Le cœur de la vidéo.** Tout le reste, les concurrents l'ont.

On prend **Pierre Dubois**, pas Sophie Renard. Son casier est périmé — c'est
l'alerte forte — et ce document est valable un an, donc l'échéance se
recalcule à l'écran. La visite médicale, elle, se saisit à la main. Moins
parlant.

1. Cliquer **« Pierre Dubois — Casier judiciaire »** dans le bloc
   « Documents expirés ».

2. La fiche s'ouvre, descend toute seule, la ligne se surligne.

   **[silence 2 s — ne rien dire pendant que ça défile]**

   > « Voilà. Direct sur la bonne ligne. »

3. Montrer **« 6/7 conformes »**.

   > « Sept documents obligatoires par chauffeur. Permis, aptitude, casier,
   > SST, TPMR, éco-conduite, visite médicale. Il en manque un. »

4. Cliquer **« Mettre à jour »**. Saisir la date du jour en date de validation.

   **[laisser le champ d'échéance se remplir tout seul — silence]**

   > « Le casier c'est un an. La date de fin, il la met. »

   Enregistrer.

5. Remonter. Pastille verte, **7/7**.

**Ne pas retourner au tableau de bord** pour montrer que l'alerte a disparu.
Ça se comprend.

---

## 1:50 — 2:30 · La fiche véhicule

**À l'écran :** Véhicules → **AB-123-CD**, le Renault Master.

> « Le Master, celui qui était en tête. »

1. **L'en-tête** : plaque, modèle, mise en circulation, kilométrage, et les
   trois pastilles de documents.

2. Cliquer **Modifier**, déposer la carte grise depuis `demo-assets/`,
   enregistrer.

   > « Carte grise, assurance, licence. »

   **[silence pendant le téléversement]**

   Cliquer **Voir** : le PDF s'ouvre.

   > « Le fichier est stocké en privé. Le lien qui l'ouvre vit le temps de
   > l'ouvrir. »

   Refermer l'onglet.

3. **Les onglets**, sous l'en-tête : Kilométrage · Maintenance · Contrôles
   tech. · Lavages · Affectations.

4. Ouvrir **Contrôles tech.** — le dernier CT, l'échéance à cinq jours,
   l'historique dessous.

5. Ouvrir **Maintenance**.

   > « Douze mois ou vingt mille bornes. Le premier des deux qui tombe,
   > l'alerte part. »

**Ne pas ouvrir l'onglet Lavages** si tu tournes en début de mois : les lavages
du jeu de démonstration ont neuf et vingt-six jours, le plus vieux peut basculer
sur le mois précédent.

---

## 2:30 — 3:00 · Le quotidien

**Trois écrans, vite.** Le rythme compte plus que le détail.

1. **Carburant & Kilométrage.** Saisir un relevé.

   > « Les relevés arrivent là. Et les chauffeurs ont leur propre accès, limité
   > à leurs véhicules. Ils saisissent depuis le téléphone, ils voient rien du
   > reste. »

   **On reste sur l'écran du gestionnaire.** L'accès chauffeur est mentionné,
   pas montré — il faudrait se déconnecter.

2. **Lavages.**

   > « Vingt-quatre lavages. Véhicule, chauffeur, montant. Le total est en
   > haut. »

   La page liste **tout**, pas seulement le mois en cours. Ne pas dire « ce
   mois-ci ».

3. **Affectations.**

   > « Douze en cours. Tu réaffectes en deux clics, l'ancienne reste dans
   > l'historique. »

---

## 3:00 — 3:40 · Rapports

**L'écran est mensuel.** Un mois à la fois, flèches pour changer. Ne pas
promettre une période libre.

1. Les compteurs du mois : distance, pleins, entretiens.

2. **Dépenses par catégorie** — maintenance, carburant, lavages.

   > « Où part l'argent ce mois-ci. Et le mois d'avant, pour comparer. »

3. **Véhicules les plus coûteux.**

   **[silence 2 s]**

   > « Et sur quel véhicule. C'est la question qu'on te pose en réunion
   > budget. »

4. **Échéances du mois** — CT et documents chauffeurs.

5. **Télécharger le PDF.** Le montrer s'ouvrir.

   > « Ça part à la compta tel quel. »

   **Assumer la limite, ici :**

   > « C'est mois par mois. Si tu veux du trimestre ou du sur-mesure, c'est pas
   > encore là. »

---

## 3:40 — 4:10 · Ce qui tourne sans toi

**À l'écran :** Paramètres → Notifications.

> « Tout ça, faut que j'ouvre l'appli. Mais une échéance, elle tombe pas quand
> je regarde. »

**[silence 2 s]**

> « Une fois par semaine, un mail avec ce qui arrive dans les trente jours. CT,
> documents, entretiens. Et plus tôt si un truc passe sous sept jours. »

Montrer l'interrupteur **« Recevoir l'email d'échéances »**.

**Sur le compte de démonstration il est coupé** — le seed le désactive pour ne
pas envoyer d'emails pendant les essais. Deux options : le dire (« là je l'ai
coupé pour la démo »), ou l'activer juste avant de filmer le plan. Ne pas le
laisser visible sans rien en dire.

---

## 4:10 — 4:30 · La clôture

**À l'écran :** retour au tableau de bord.

> « Quinze véhicules, douze chauffeurs. Les échéances sont vues, un document
> est refait, le rapport est prêt. »

**[silence 2 s]**

> « Voilà. C'est à peu près une matinée de lundi, en quatre minutes. »

Curseur immobile deux secondes avant de couper.

---

## Ce qu'il ne faut pas faire à l'écran

- **Ne pas ajouter un CT en direct sur un véhicule en alerte.** Le centre
  d'alertes ne dédoublonne pas les contrôles par véhicule : l'alerte reste
  affichée, et ça se voit.
- **Ne pas changer la période du graphe d'utilisation.** Trois mois de relevés
  seulement : 6 mois et 1 an donnent les mêmes barres, et un sélecteur qui ne
  change rien se remarque.
- **Ne pas ouvrir les documents des 14 autres véhicules.** Seul AB-123-CD a ses
  pièces jointes.
- **Ne pas recharger la page.** La chorégraphie ne rejoue pas, et un chargement
  nu se voit.
- **Ne pas s'attarder sur la suppression de compte.**

---

## Accroches par secteur

À poser en ouverture, à la place de la première phrase.

**Transport de marchandises**
> « Une licence périmée, c'est le camion à l'arrêt et une amende. »

**Transport de personnes / TPMR**
> « Aptitude, visite médicale, TPMR. Trois papiers par chauffeur, douze
> chauffeurs, trente-six dates. »

**BTP**
> « Tes véhicules sont sur les chantiers. Le kilométrage se saisit au
> téléphone, toi tu vois le parc. »

**Artisan / petit parc**
> « Cinq véhicules, ça tient dans un tableur. Jusqu'au CT qui passe à
> travers. »
