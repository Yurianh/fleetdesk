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

---

## 0:00 — 0:20 · L'ouverture

**À l'écran :** la connexion, puis le tableau de bord qui se pose élément par
élément.

> « FleetDesk, c'est le logiciel qui tient votre flotte. Voici le compte d'une
> société de transport toulousaine qui l'utilise : quinze véhicules, douze
> conducteurs. On est lundi matin — et la première chose qu'un gestionnaire
> veut savoir, c'est ce qui va lui poser problème cette semaine. »

**Ne rien cliquer pendant l'animation.** Elle dure environ deux secondes et
demie : laisse-la finir, c'est la seule fois où elle joue.

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
   > expiré il y a huit jours, la visite médicale de Sophie Renard tombe dans
   > vingt et un jours. »

   **Point à faire entendre :** la couleur n'est pas là pour faire peur.
   L'ambre signale ce qui demande une action, le gris ce qu'on surveille. Rien
   n'est rouge — le rouge est réservé à ce qu'on supprime.

3. **Les quatre compteurs** (Véhicules, Conducteurs, Affectations, Problèmes).

   > « Quinze véhicules, douze affectés. Trois volants libres : c'est normal,
   > une flotte garde de la réserve. »

4. **« Utilisation des véhicules »**, le graphe central. Basculer **3 mois →
   1 an** et laisser les barres se recomposer.

   > « Le kilométrage parcouru sur la période. Je vois tout de suite qui
   > tourne — le Fiat Ducato à vingt-quatre mille kilomètres — et qui dort. »

---

## 1:10 — 1:50 · L'alerte jusqu'au bout

**Le moment le plus important de la vidéo.** On ne montre pas une alerte, on
montre qu'elle mène quelque part.

1. Cliquer sur **« Sophie Renard — Visite médecin du travail »** dans le panneau
   d'alertes.

2. La fiche conducteur s'ouvre, **défile jusqu'à la ligne concernée et la
   souligne**.

   > « Je clique sur l'alerte et j'arrive exactement sur le document qui la
   > déclenche. Pas sur la fiche, pas sur une liste de sept lignes : sur la
   > ligne. »

3. Montrer le compteur **« 6/7 conformes »** et la pastille ambre de la visite
   médicale.

   > « Sept documents réglementaires par conducteur : permis, aptitude à la
   > conduite, casier, SST, TPMR, éco-conduite, visite médicale. Six sont à
   > jour, un arrive à échéance. »

4. Cliquer **« Renouveler »**, saisir une date de validation, enregistrer.

   > « Je saisis la nouvelle date. L'échéance se recalcule toute seule selon la
   > durée de validité du document. »

5. Remonter : la pastille est passée au vert, le compteur à **7/7**.

**Ne pas revenir au tableau de bord** pour vérifier que l'alerte a disparu :
laisse la démonstration sur ce geste, l'enchaînement se fait tout seul.

---

## 1:50 — 2:30 · La fiche véhicule

**À l'écran :** Véhicules → **AB-123-CD** (Renault Master).

> « Le véhicule qui était en tête des alertes. »

1. **L'en-tête** : plaque, modèle, mise en circulation, conducteur affecté.
2. **Le contrôle technique** à cinq jours, et l'historique en dessous.
3. **L'entretien** : dernière intervention, prochaine échéance calculée à
   partir de l'intervalle du planning.

   > « L'application ne se contente pas d'enregistrer ce qui a été fait : elle
   > en déduit ce qui arrive. Douze mois ou vingt mille kilomètres — le premier
   > des deux atteint déclenche l'alerte. »

4. **Les documents du véhicule.** Cliquer **Modifier**, déposer la carte grise
   depuis `demo-assets/`, enregistrer.

   > « Carte grise, assurance, licence de transport. Le fichier est stocké de
   > façon privée : ce lien n'existe que le temps de l'ouvrir. »

   Cliquer sur **Voir** pour ouvrir le PDF, puis refermer l'onglet.

---

## 2:30 — 3:00 · Les opérations quotidiennes

**Trois écrans, vite.** C'est le rythme qui compte, pas le détail.

1. **Carburant & Kilométrage.** Saisir un relevé sur un véhicule.

   > « Le chauffeur saisit son kilométrage depuis son téléphone. Il ne voit que
   > ses véhicules, rien d'autre de la flotte. »

2. **Lavages.** Montrer la liste du mois.

   > « Chaque lavage est rattaché au véhicule et au conducteur. En fin de mois,
   > le total est déjà fait. »

3. **Affectations.** Montrer qui conduit quoi.

   > « Douze affectations en cours. Réaffecter un véhicule prend deux clics, et
   > l'historique reste. »

---

## 3:00 — 3:40 · Rapports : ce qu'on prouve

**À l'écran :** Rapports.

1. **Dépenses par catégorie** — entretien, contrôles techniques, carburant,
   lavages.

   > « Où part l'argent, sur la période que je choisis. »

2. **Véhicules les plus coûteux.**

   > « Et surtout : sur quel véhicule. C'est la conversation qu'on a en réunion
   > budget, et elle est là, sans tableur. »

3. **Télécharger le PDF.** Montrer le fichier qui s'ouvre.

   > « Un PDF prêt à envoyer à la direction ou à l'expert-comptable. »

---

## 3:40 — 4:10 · Ce qui tourne sans vous

**À l'écran :** Paramètres → section Notifications.

> « Tout ce que je viens de montrer suppose que j'ouvre l'application. Mais une
> échéance ne tombe pas quand je regarde. »

> « Chaque matin, FleetDesk envoie un récapitulatif des échéances qui
> approchent — par email, sans que personne n'ait rien à ouvrir. L'application
> vient vous chercher, pas l'inverse. »

Montrer l'interrupteur, et le fait qu'on peut le couper.

---

## 4:10 — 4:30 · La clôture

**À l'écran :** revenir au tableau de bord.

> « Quinze véhicules, douze conducteurs, une matinée de lundi. Les échéances
> sont vues, un document est renouvelé, un rapport est parti à la compta. »

> « C'est ce que fait FleetDesk : votre flotte tient dans un écran, et ce qui
> compte vient vous chercher. »

Fin sur le tableau de bord, curseur immobile deux secondes avant de couper.

---

## Ce qu'il ne faut pas faire à l'écran

- **Ne pas ajouter un contrôle technique en direct sur un véhicule en alerte.**
  Le centre d'alertes ne dédoublonne pas les contrôles par véhicule : l'alerte
  reste affichée, et ça se voit.
- **Ne pas ouvrir « Utilisation des véhicules » sur une période où un véhicule
  n'a qu'un seul relevé** — il faut au moins deux points pour tracer une barre.
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
