# Script de démonstration — FleetDesk

**Durée visée : 4 min 30.** FleetDesk est le logiciel présenté. Occitrans
Services est la société fictive dont on montre le compte — 15 véhicules,
12 chauffeurs, sur `demo@fleetdesk.fr`. Ne jamais laisser entendre que
FleetDesk *est* le transporteur : c'est l'outil du transporteur.

## La voix

**Tonalité opérateur.** Tu parles à quelqu'un qui gère quinze camions et qui se
méfie de ce qui brille. Débit normal, pas d'emphase. La crédibilité vient du
vocabulaire juste, pas de l'énergie.

Le lexique, d'abord :

- **Le CT**, jamais « le contrôle technique » à l'oral.
- **Un chauffeur**, pas « un conducteur » — l'écran écrit conducteur, toi tu
  dis chauffeur.
- **La carte grise**, **la licence**, **la visite médicale**, **le casier**.
- **Des bornes** ou des kilomètres, dits à voix haute : « douze mille six
  cents », pas « 12 614 ».

Ensuite, le débit. **Varie la longueur des phrases.** Une suite de phrases de
trois mots, c'est un télégramme, et ça s'entend aussi faux qu'un texte trop
écrit. Laisse-toi partir sur une phrase un peu longue de temps en temps, avec
un « donc », un « en fait », un « bon ». Reprends-toi si besoin, ce n'est pas
grave — c'est même ce qui prouve qu'un humain conduit.

Les répliques ci-dessous sont des **appuis, pas un texte à réciter.** Garde le
sens, les chiffres et le vocabulaire ; dis-le avec tes mots.

**Ne décris pas ce que fait le curseur.** Le spectateur le voit.

**Laisse du blanc.** Les silences notés ne sont pas des trous : c'est là que le
spectateur regarde l'écran.

**Une seule vraie phrase de conclusion**, à la fin. Pas une par section.

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

> « Bon, FleetDesk, c'est un logiciel de gestion de parc. Là je suis sur le
> compte d'un transporteur toulousain — quinze véhicules, douze chauffeurs.
> C'est un compte de démonstration, mais les données ressemblent à ce que vous
> auriez chez vous. »

**[silence — laisser l'animation finir]**

> « Et on est lundi matin, donc la vraie question c'est : qu'est-ce qui va me
> tomber dessus cette semaine. »

**Ne rien cliquer pendant l'animation.** Un peu plus de quatre secondes, les
derniers éléments arrivent en dernier. C'est la seule fois où elle joue.

---

## 0:20 — 1:10 · Le tableau de bord

**À l'écran :** on reste. Curseur lent, une zone à la fois.

1. La pastille **« 2 alertes actives »**, en haut à droite.

   > « Deux alertes actives en haut. On va voir ce que c'est. »

2. **Le panneau Alertes**, à droite. Descendre lentement.

   > « Alors, le CT du Master saute dans cinq jours — ça, faut que je prenne le
   > rendez-vous aujourd'hui, sinon je me retrouve avec un camion immobilisé
   > vendredi. Le Boxer, lui, c'est dans trois semaines, donc je le note et je
   > m'en occupe la semaine prochaine. Et la révision du Master arrive dans
   > neuf mille six cents bornes. »

   **[silence 2 s]**

   > « Et en dessous, les chauffeurs. Le casier de Pierre Dubois est périmé
   > depuis huit jours. Celui de Sophie... pardon, la visite médicale de
   > Sophie Renard, elle tombe dans trois semaines. »

   **Sur la couleur, ne rien expliquer à l'image.** Si on te pose la question
   après : l'ambre appelle une action, le gris se surveille, le rouge est
   réservé à ce qu'on supprime.

3. **Les quatre compteurs.**

   > « Quinze véhicules, douze affectés. Les trois autres ils tournent pas
   > cette semaine, c'est de la réserve. »

4. **« Utilisation des véhicules »**, le graphe.

   > « Ça c'est le kilométrage sur trois mois. Le Ducato est à douze mille six
   > cents, il tourne beaucoup. Le Proace, en bas, mille cent — celui-là, à un
   > moment, faut se demander pourquoi on le garde. »

   **[silence 2 s]**

   Cliquer **« Afficher : Plaque »**, choisir **Conducteur**.

   > « Et si vous raisonnez plutôt par chauffeur que par plaque, c'est le même
   > graphe. »

   **Ne pas toucher au sélecteur de période.** Le compte n'a que trois mois de
   relevés : 6 mois et 1 an donnent les mêmes barres.

---

## 1:10 — 1:50 · L'alerte jusqu'au bout

**Le cœur de la vidéo.** Tout le reste, les concurrents l'ont.

On prend **Pierre Dubois**, pas Sophie Renard : son casier est périmé, c'est
l'alerte forte, et ce document est valable un an donc l'échéance se recalcule
à l'écran. La visite médicale, elle, se saisit à la main. Moins parlant.

1. Cliquer **« Pierre Dubois — Casier judiciaire »** dans le bloc
   « Documents expirés ».

2. La fiche s'ouvre, descend toute seule, la ligne se surligne.

   **[silence 2 s — ne rien dire pendant que ça défile]**

   > « Voilà, direct sur la bonne ligne. C'est bête mais c'est tout le
   > problème : d'habitude tu cliques sur une alerte et tu atterris sur une
   > fiche, et après tu cherches. »

3. Montrer **« 6/7 conformes »**.

   > « Sept papiers obligatoires par chauffeur : permis, aptitude, casier, SST,
   > TPMR, éco-conduite, visite médicale. Là il en manque un. »

4. Cliquer **« Mettre à jour »**. Saisir la date du jour en date de validation.

   **[laisser le champ d'échéance se remplir tout seul — silence]**

   > « Je mets la date du nouveau papier, et la date de fin il la calcule tout
   > seul — le casier c'est un an. »

   Enregistrer.

5. Remonter. Pastille verte, **7/7**.

**Ne pas retourner au tableau de bord** pour montrer que l'alerte a disparu.
Ça se comprend.

---

## 1:50 — 2:30 · La fiche véhicule

**À l'écran :** Véhicules → **AB-123-CD**, le Renault Master.

> « On revient sur le Master, celui qui était en tête tout à l'heure. »

1. **L'en-tête** : plaque, modèle, mise en circulation, kilométrage, et les
   trois pastilles de documents.

2. Cliquer **Modifier**, déposer la carte grise depuis `demo-assets/`,
   enregistrer.

   > « Carte grise, assurance, licence de transport. Je prends la carte grise,
   > je la dépose... »

   **[silence pendant le téléversement]**

   Cliquer **Voir** : le PDF s'ouvre.

   > « Et je la ressors quand j'en ai besoin. Le fichier est stocké en privé,
   > le lien qui l'ouvre vit le temps de l'ouvrir. »

   Refermer l'onglet.

3. **Les onglets**, sous l'en-tête : Kilométrage · Maintenance · Contrôles
   tech. · Lavages · Affectations.

4. Ouvrir **Contrôles tech.** — le dernier CT, l'échéance à cinq jours,
   l'historique dessous.

5. Ouvrir **Maintenance**.

   > « Là on est sur douze mois ou vingt mille bornes, selon ce qui arrive en
   > premier. Et c'est le premier des deux qui déclenche l'alerte. »

**Ne pas ouvrir l'onglet Lavages** si tu tournes en début de mois : les lavages
du jeu de démonstration ont neuf et vingt-six jours, le plus vieux peut basculer
sur le mois précédent.

---

## 2:30 — 3:00 · Le quotidien

**Trois écrans, vite.** Le rythme compte plus que le détail.

1. **Carburant & Kilométrage.** Saisir un relevé.

   > « Les relevés arrivent là. Et les chauffeurs ont leur propre accès, limité
   > à leurs véhicules — ils saisissent depuis leur téléphone au moment du
   > plein, et ils voient rien du reste du parc. »

   **On reste sur l'écran du gestionnaire.** L'accès chauffeur est mentionné,
   pas montré : il faudrait se déconnecter.

2. **Lavages.**

   > « Les lavages, pareil : véhicule, chauffeur, montant. Et le total est
   > déjà fait en haut. »

3. **Affectations.**

   > « Douze affectations en cours. Vous réaffectez en deux clics, et l'ancienne
   > reste dans l'historique — donc si on vous demande qui conduisait quoi au
   > mois de mars, c'est là. »

---

## 3:00 — 3:40 · Rapports

**L'écran est mensuel.** Un mois à la fois, flèches pour changer. Ne pas
promettre une période libre.

1. Les compteurs du mois : distance, pleins, entretiens.

2. **Dépenses par catégorie** — maintenance, carburant, lavages.

   > « Où part l'argent sur le mois, et la comparaison avec le mois d'avant. »

3. **Véhicules les plus coûteux.**

   **[silence 2 s]**

   > « Et surtout sur quel véhicule. C'est la question qu'on vous pose en
   > réunion budget, et en général c'est là qu'on ressort le tableur. »

4. **Échéances du mois** — CT et documents chauffeurs.

5. **Télécharger le PDF.** Le montrer s'ouvrir.

   > « Et ça, ça part à la compta tel quel. »

   **Assumer la limite, ici :**

   > « Après, c'est mois par mois, hein. Si vous voulez du trimestre ou du
   > sur-mesure, c'est pas encore là. »

---

## 3:40 — 4:10 · Ce qui tourne sans toi

**À l'écran :** Paramètres → Notifications.

> « Bon, tout ce que je viens de montrer, faut que j'ouvre l'appli. Et une
> échéance, elle tombe pas forcément le jour où je regarde. »

**[silence 2 s]**

> « Donc une fois par semaine il envoie un mail avec ce qui arrive dans les
> trente jours : les CT, les papiers, les entretiens prévus. Et plus tôt si un
> truc passe sous les sept jours. »

Montrer l'interrupteur **« Recevoir l'email d'échéances »**.

**Sur le compte de démonstration il est coupé** — le seed le désactive pour ne
pas envoyer d'emails pendant les essais. Deux options : le dire (« là je l'ai
coupé pour la démo »), ou l'activer juste avant de filmer le plan. Ne pas le
laisser visible sans rien en dire.

---

## 4:10 — 4:30 · La clôture

**À l'écran :** retour au tableau de bord.

> « Donc voilà : quinze véhicules, douze chauffeurs. Les échéances sont vues,
> un papier est refait, le rapport est prêt à partir. »

**[silence 2 s]**

> « C'est à peu près une matinée de lundi, en quatre minutes. »

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
> « Une licence périmée, c'est le camion à l'arrêt et une amende. Et ça se joue
> à une date qu'on a pas notée. »

**Transport de personnes / TPMR**
> « Aptitude, visite médicale, TPMR : trois papiers par chauffeur. Avec douze
> chauffeurs, ça fait trente-six dates à suivre. »

**BTP**
> « Vos véhicules sont sur les chantiers, pas au bureau. Le kilométrage se
> saisit au téléphone, et vous, vous voyez le parc. »

**Artisan / petit parc**
> « Cinq véhicules ça tient dans un tableur, c'est vrai. Jusqu'au CT qui passe
> à travers. »
