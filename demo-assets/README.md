# Pièces jointes de démonstration

Trois PDF fictifs pour l'enregistrement de la vidéo, à téléverser sur le
Renault Master **AB-123-CD** :

| Fichier | Champ dans l'application |
|---|---|
| `carte-grise-AB-123-CD.pdf` | Carte grise |
| `attestation-assurance-AB-123-CD.pdf` | Assurance |
| `licence-transport-occitrans.pdf` | Licence de transport |

Chaque page porte la mention « DOCUMENT DE DÉMONSTRATION » en filigrane et la
ligne « Pièce fictive générée pour une démonstration du logiciel FleetDesk.
Sans valeur légale. » : rien à l'écran ne peut être pris pour un vrai document.

Le seed SQL ne peut pas les poser — ce sont des fichiers dans le bucket
`invoices`, pas des colonnes. Il faut passer par l'interface, ce qui tombe
bien : le téléversement est un moment de la démonstration, pas un trou.

## Marche à suivre

1. Véhicules → **AB-123-CD** → bouton **Modifier** (crayon, en haut à droite).
2. Section « Documents du véhicule », trois champs : Carte grise, Assurance,
   Licence de transport. Cliquer sur un champ ouvre le sélecteur de fichiers.
3. Enregistrer. Les pastilles passent de « Ajouter » à « Voir » ; le clic ouvre
   le PDF via un lien signé (le bucket est privé).

Formats acceptés : JPEG, PNG, WebP, PDF.
