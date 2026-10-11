# Vidéos par cas d'usage

Une vidéo par argument de vente, posée à côté du texte qu'elle prouve. Toutes
suivent les règles du hero (`hero/SPEC.md`) : fond plat, couleurs FleetDesk,
une seule forme qui se transforme sans coupure, ressorts calculés, boucle
muette, et rien qui ne soit pas dans l'application.

Format des vidéos de section : 5:4 (640 × 512 CSS, rendu 1280 × 1024). Il tient
dans une demi-colonne sur ordinateur et en pleine largeur sur mobile, avec un
texte assez gros pour rester lisible sur téléphone.

| Vidéo | Ce qu'elle prouve | Où | Vérifié dans l'application |
| --- | --- | --- | --- |
| `hero` | Les trois promesses du titre : un contrôle technique, une visite médicale et une vidange arrivent, chacune se règle, le compteur revient à zéro. 16:9 et 4:5. | Hero | Alertes à 30 jours, documents conducteurs, vidange au kilométrage (5 000 km avant), e-mail des échéances. |
| `fiche` | Tout sur un véhicule en un clic : conducteur, kilométrage, prochaines échéances. | « Vos véhicules, d'un coup d'œil » | `VehicleDetail.jsx` : affectation, kilométrage, échéances, prévision d'entretien. |
| `documents` | Un document conducteur qui expire est vu à temps ; une fois la pièce déposée, l'échéance est recalculée. | « Zéro document expiré » | `DriverDocuments.jsx` : dépôt par le gestionnaire, échéance recalculée. Le chauffeur ne dépose pas lui-même. |
| `entretien` | L'entretien se déclenche au kilométrage réel : alerte 5 000 km avant, remise à zéro après l'atelier. | « Anticipez les pannes » | `maintenanceForecast.js` : `WARN_KM = 5000`, première des deux limites. |
| `couts` | Le rapport du mois : total, répartition entretien / carburant / lavages, évolution, véhicules les plus coûteux. | « Comprenez vos coûts réels » | `Reports.jsx`. Pas de coût au kilomètre : l'application ne le calcule pas. |
| `saisie` | Le chauffeur saisit kilométrage, plein et photo du ticket sur son téléphone ; le bureau le voit aussitôt. | « Vos chauffeurs saisissent au volant » | `Mileage.jsx` : kilométrage et montant obligatoires, photos compteur et ticket. Comptes chauffeurs : formule Enterprise. |

Idées suivantes, non faites : l'e-mail hebdomadaire des échéances (page
conformité), la mise en route en quelques minutes (section « 3 étapes »).

## Refaire une vidéo

```
cd motion
node render.mjs <scene> --stills 0,2,4,6,8   # images fixes à relire
node render.mjs <scene> --check-loop
node render.mjs <scene>                      # MP4 + image fixe dans marketing/public/videos
```
