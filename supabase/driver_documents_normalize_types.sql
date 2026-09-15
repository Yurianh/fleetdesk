-- ============================================================
-- Normalisation des types de documents conducteurs
--
-- Des documents ont été enregistrés sous des clés courtes (« medical »,
-- « permis », « sst ») qui ne correspondent à aucune ligne réglementaire de
-- l'application. Conséquence : le document existait en base mais n'apparaissait
-- sur aucune ligne de la fiche conducteur, et l'alerte du tableau de bord
-- affichait la clé brute au lieu du libellé.
--
-- L'application sait désormais les rattacher à la lecture ; ce script remet la
-- base au propre pour de bon. Exécution unique, sans risque de doublon.
-- ============================================================

UPDATE driver_documents
   SET type = CASE lower(type)
     WHEN 'medical'          THEN 'visite_medecin'
     WHEN 'medecin'          THEN 'visite_medecin'
     WHEN 'visite_medicale'  THEN 'visite_medecin'
     WHEN 'permis'           THEN 'permis_conduire'
     WHEN 'sst'              THEN 'formation_sst_psc1'
     WHEN 'psc1'             THEN 'formation_sst_psc1'
     WHEN 'tpmr'             THEN 'formation_tpmr'
     WHEN 'eco_conduite'     THEN 'formation_eco_conduite'
     WHEN 'aptitude'         THEN 'aptitude_conduite'
     WHEN 'casier'           THEN 'casier_judiciaire'
   END
 WHERE lower(type) IN ('medical','medecin','visite_medicale','permis','sst',
                       'psc1','tpmr','eco_conduite','aptitude','casier');

-- Ce qui reste hors des clés connues (visible dans la fiche, section « Autre ») :
SELECT type, count(*) AS nb
  FROM driver_documents
 WHERE type NOT LIKE 'autre:%'
   AND type NOT IN ('permis_conduire','aptitude_conduite','casier_judiciaire',
                    'formation_sst_psc1','formation_tpmr','formation_eco_conduite',
                    'visite_medecin')
 GROUP BY type
 ORDER BY nb DESC;
