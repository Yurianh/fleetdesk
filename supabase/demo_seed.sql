-- ============================================================
-- Jeu de données de démonstration — Occitrans Services (Toulouse)
-- À exécuter dans le SQL Editor de Supabase, sur un compte DÉDIÉ.
--
-- 15 véhicules, 12 conducteurs, 12 affectations actives. Chaque véhicule a son
-- historique kilométrique, son contrôle technique, son entretien réalisé et son
-- planning ; chaque conducteur a ses sept documents réglementaires. Aucune
-- fiche ne s'ouvre sur du vide pendant l'enregistrement.
--
-- Toutes les dates sont relatives à aujourd'hui : le script reste valable quel
-- que soit le jour de l'enregistrement.
--
-- Les alertes sont dosées, pas subies : deux véhicules et deux conducteurs
-- seulement sont en échéance. Tout le reste est au vert.
--
-- ⚠️ Le script EFFACE les données existantes du compte visé avant d'insérer.
-- Garde-fou : il refuse tout email ne contenant pas « demo ».
-- Le relancer remet la démonstration à zéro.
-- ============================================================

DO $$
DECLARE
  demo_email text := 'demo@fleetdesk.fr';   -- ← adresse du compte de démonstration
  org uuid;
BEGIN
  IF demo_email NOT LIKE '%demo%' THEN
    RAISE EXCEPTION 'Sécurité : ce script ne doit viser qu''un compte de démonstration (email contenant « demo »). Reçu : %', demo_email;
  END IF;

  SELECT id INTO org FROM auth.users WHERE email = demo_email;
  IF org IS NULL THEN
    RAISE EXCEPTION 'Compte introuvable : %. Créez-le d''abord via l''inscription de l''application.', demo_email;
  END IF;

  -- ── Remise à zéro du compte de démonstration ──────────────
  DELETE FROM driver_documents      WHERE org_id  = org;
  DELETE FROM wash_records          WHERE user_id = org;
  DELETE FROM technical_inspections WHERE user_id = org;
  DELETE FROM maintenance_records   WHERE user_id = org;
  DELETE FROM maintenance_schedules WHERE user_id = org;
  DELETE FROM mileage_entries       WHERE user_id = org;
  DELETE FROM assignments           WHERE user_id = org;
  DELETE FROM drivers               WHERE user_id = org;
  DELETE FROM vehicles              WHERE user_id = org;
  DELETE FROM activity_log          WHERE org_id  = org;
  DELETE FROM digest_log            WHERE org_id  = org;

  -- ── Formule et identité de la société ─────────────────────
  -- Enterprise : sinon les lavages et l'analytique affichent un écran de
  -- mise à niveau. digest_opt_out : aucun email automatique pendant la démo.
  UPDATE auth.users
     SET raw_app_meta_data  = COALESCE(raw_app_meta_data, '{}'::jsonb)  || '{"plan":"enterprise"}'::jsonb,
         raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) ||
           '{"full_name":"Thomas Lemaire","company":"Occitrans Services","org_company":"Occitrans Services","activity":"transport","onboarding_complete":true,"digest_opt_out":true}'::jsonb
   WHERE id = org;

  -- ── La flotte, décrite une seule fois ─────────────────────
  -- Le kilométrage, le contrôle technique et l'entretien sont dérivés de cette
  -- table : impossible qu'une liste diverge d'une autre au fil des retouches.
  --   ct_ago / ct_left : dernier contrôle technique et jours restants
  --   ent_ago          : dernier entretien réalisé
  DROP TABLE IF EXISTS demo_fleet;
  CREATE TEMP TABLE demo_fleet (
    plate text, model text, mec date, km int,
    ct_ago int, ct_left int, ent_ago int, ent_months int, ent_km int, ent_mileage int,
    ent_status text, ent_issue text, ent_amount numeric
  ) ON COMMIT DROP;

  INSERT INTO demo_fleet VALUES
    ('AB-123-CD', 'Renault Master',     DATE '2021-03-12', 128400, 360,   5, 350, 12, 20000, 118000, 'OK',      'Vidange + filtre à huile',            289.90),
    ('EF-456-GH', 'Peugeot Boxer',      DATE '2020-09-04', 164200, 343,  22, 120, 12, 25000, 152000, 'OK',      'Révision constructeur',               412.50),
    ('IJ-789-KL', 'Citroën Jumpy',      DATE '2022-01-20',  74300, 250, 115,  95, 12, 20000,  68900, 'OK',      'Vidange + filtre à air',              264.00),
    ('MN-012-OP', 'Ford Transit',       DATE '2019-06-28', 198700, 120, 245,  12, 12, 20000, 196400, 'PROBLEM', 'Bruit de roulement à l''avant droit',   0.00),
    ('QR-345-ST', 'Mercedes Sprinter',  DATE '2022-11-15',  61250,  60, 305,  40, 24, 30000,  58900, 'OK',      'Plaquettes avant',                    198.00),
    ('UV-678-WX', 'Renault Trafic',     DATE '2021-07-02', 112900, 200, 165, 200, 12, 20000, 104500, 'OK',      'Vidange + filtres',                   327.40),
    ('YZ-901-AB', 'Peugeot Partner',    DATE '2023-02-08',  38600,  30, 335,  70, 12, 15000,  34200, 'OK',      'Révision des 30 000 km',              310.00),
    ('CD-234-EF', 'Citroën Berlingo',   DATE '2020-04-17', 147500, 290,  75, 150, 12, 20000, 139800, 'OK',      'Vidange + plaquettes arrière',        352.80),
    ('GH-567-IJ', 'Fiat Ducato',        DATE '2018-10-30', 221300, 150, 215,   6, 12, 30000, 219800, 'OK',      'Distribution + courroie',             640.00),
    ('KL-890-MN', 'Renault Kangoo',     DATE '2023-05-22',  27400,  95, 270,  55, 12, 15000,  24100, 'OK',      'Première révision',                   189.50),
    ('OP-123-QR', 'Ford Custom',        DATE '2021-12-09',  96800, 310,  55, 180, 12, 20000,  88400, 'OK',      'Vidange + filtre habitacle',          298.00),
    ('ST-456-UV', 'Opel Vivaro',        DATE '2022-08-14',  68900,  45, 320, 110, 12, 20000,  63500, 'OK',      'Révision constructeur',               374.90),
    ('WX-789-YZ', 'Volkswagen Crafter', DATE '2019-11-26', 183200, 220, 145,  25, 12, 25000, 181600, 'PROBLEM', 'Voyant moteur allumé par intermittence', 0.00),
    ('AC-012-BD', 'Toyota Proace',      DATE '2023-09-05',  19750,  15, 350,  85, 12, 15000,  15800, 'OK',      'Première révision',                   176.00),
    ('EG-345-FH', 'Mercedes Vito',      DATE '2020-02-11', 156400, 275,  90, 210, 12, 25000, 145200, 'OK',      'Vidange + freins avant',              445.00);

  -- ── Véhicules ─────────────────────────────────────────────
  INSERT INTO vehicles (user_id, plate_number, model, mec_date, created_at)
  SELECT org, plate, model, mec, now() - (interval '1 day' * 120) FROM demo_fleet;

  -- ── Conducteurs ───────────────────────────────────────────
  INSERT INTO drivers (user_id, name, email, phone, date_of_birth, created_at)
  SELECT org, d.name, d.email, d.phone, d.birth, now() - (interval '1 day' * 118)
  FROM (VALUES
    ('Karim Aïssa', 'k.aissa@occitrans-demo.fr', '06 12 34 56 78', DATE '1988-04-17'),
    ('Sophie Renard', 's.renard@occitrans-demo.fr', '06 23 45 67 89', DATE '1979-11-03'),
    ('Marc Lefebvre', 'm.lefebvre@occitrans-demo.fr', '06 34 56 78 90', DATE '1985-06-22'),
    ('Amel Benali', 'a.benali@occitrans-demo.fr', '06 45 67 89 01', DATE '1992-01-14'),
    ('Thomas Sanchez', 't.sanchez@occitrans-demo.fr', '06 56 78 90 12', DATE '1983-09-30'),
    ('Julien Mercier', 'j.mercier@occitrans-demo.fr', '06 67 89 01 23', DATE '1990-03-08'),
    ('Nadia Cherif', 'n.cherif@occitrans-demo.fr', '06 78 90 12 34', DATE '1987-07-19'),
    ('Pierre Dubois', 'p.dubois@occitrans-demo.fr', '06 89 01 23 45', DATE '1975-12-05'),
    ('Laura Fontaine', 'l.fontaine@occitrans-demo.fr', '06 90 12 34 56', DATE '1994-05-27'),
    ('Ahmed Belkacem', 'a.belkacem@occitrans-demo.fr', '06 01 23 45 67', DATE '1981-08-11'),
    ('Céline Roux', 'c.roux@occitrans-demo.fr', '06 11 22 33 44', DATE '1989-02-23'),
    ('David Martinez', 'd.martinez@occitrans-demo.fr', '06 22 33 44 55', DATE '1986-10-09')
  ) AS d(name, email, phone, birth);

  -- ── Affectations en cours ─────────────────────────────────
  -- Douze conducteurs, douze véhicules attribués. Trois véhicules restent
  -- libres (Crafter, Proace, Vito) : une flotte réelle garde des volants.
  INSERT INTO assignments (user_id, vehicle_id, driver_id, assigned_at)
  SELECT org,
         (SELECT id FROM vehicles WHERE user_id = org AND plate_number = a.plate),
         (SELECT id FROM drivers  WHERE user_id = org AND name = a.driver),
         now() - (interval '1 day' * a.days)
  FROM (VALUES
    ('AB-123-CD', 'Karim Aïssa', 90),
    ('EF-456-GH', 'Sophie Renard', 85),
    ('IJ-789-KL', 'Marc Lefebvre', 80),
    ('MN-012-OP', 'Amel Benali', 75),
    ('QR-345-ST', 'Thomas Sanchez', 70),
    ('UV-678-WX', 'Julien Mercier', 65),
    ('YZ-901-AB', 'Nadia Cherif', 60),
    ('CD-234-EF', 'Pierre Dubois', 55),
    ('GH-567-IJ', 'Laura Fontaine', 50),
    ('KL-890-MN', 'Ahmed Belkacem', 45),
    ('OP-123-QR', 'Céline Roux', 40),
    ('ST-456-UV', 'David Martinez', 35)
  ) AS a(plate, driver, days);

  -- ── Kilométrages : quatre relevés par véhicule sur 3 mois ─
  -- Deux relevés minimum sont nécessaires pour que « Utilisation des
  -- véhicules » affiche des barres plutôt qu'un écran vide.
  INSERT INTO mileage_entries (user_id, vehicle_id, mileage, amount, created_at)
  SELECT org, v.id,
         ROUND(f.km - (f.km * 0.019 * s.step))::int,
         CASE WHEN s.step > 0 THEN ROUND((85 + random() * 45)::numeric, 2) ELSE NULL END,
         now() - (interval '1 day' * s.days)
  FROM demo_fleet f
  JOIN vehicles v ON v.user_id = org AND v.plate_number = f.plate
  CROSS JOIN (VALUES (3, 88), (2, 60), (1, 32), (0, 4)) AS s(step, days);

  -- ── Contrôles techniques (les 15 véhicules) ───────────────
  INSERT INTO technical_inspections (user_id, vehicle_id, inspection_date, expiration_date, invoice_amount, created_at)
  SELECT org, v.id,
         CURRENT_DATE - f.ct_ago,
         CURRENT_DATE + f.ct_left,
         78.00,
         now() - (interval '1 day' * f.ct_ago)
  FROM demo_fleet f
  JOIN vehicles v ON v.user_id = org AND v.plate_number = f.plate;

  -- ── Entretiens réalisés (les 15 véhicules) ────────────────
  INSERT INTO maintenance_records (user_id, vehicle_id, date, mileage, status, issue_description, invoice_amount, created_at)
  SELECT org, v.id,
         CURRENT_DATE - f.ent_ago,
         f.ent_mileage,
         f.ent_status, f.ent_issue, f.ent_amount,
         now() - (interval '1 day' * f.ent_ago)
  FROM demo_fleet f
  JOIN vehicles v ON v.user_id = org AND v.plate_number = f.plate;

  -- ── Plannings d'entretien (les 15 véhicules) ──────────────
  -- Le Renault Master a été entretenu il y a 350 jours pour un intervalle de
  -- 12 mois : sa prochaine échéance tombe dans une quinzaine de jours.
  INSERT INTO maintenance_schedules (user_id, vehicle_id, interval_months, interval_km, notes, created_at)
  SELECT org, v.id, f.ent_months, f.ent_km, f.ent_issue, now() - (interval '1 day' * 100)
  FROM demo_fleet f
  JOIN vehicles v ON v.user_id = org AND v.plate_number = f.plate;

  -- ── Lavages du mois ───────────────────────────────────────
  -- Chaque véhicule affecté est lavé deux fois dans le mois, par son propre
  -- conducteur : le rapprochement véhicule/conducteur reste vrai à l'écran.
  INSERT INTO wash_records (user_id, vehicle_id, driver_id, date, amount, created_at)
  SELECT org, a.vehicle_id, a.driver_id,
         CURRENT_DATE - w.ago,
         ROUND((14 + ((row_number() OVER (ORDER BY a.assigned_at, w.ago)) % 6) * 1.8)::numeric, 2),
         now() - (interval '1 day' * w.ago)
  FROM assignments a
  CROSS JOIN (VALUES (26), (9)) AS w(ago)
  WHERE a.user_id = org;

  -- ── Documents conducteurs (7 par conducteur) ──────────────
  -- L'échéance est étalée par une arithmétique déterministe : entre 60 jours et
  -- la fin de validité, donc personne n'est en alerte par accident. Les deux
  -- cas de démonstration sont posés juste après, à la main.
  INSERT INTO driver_documents (org_id, driver_id, type, validation_date, expiry_date, created_at)
  SELECT org, d.id, t.type,
         CURRENT_DATE - (t.validity - r.remaining),
         CURRENT_DATE + r.remaining,
         now() - (interval '1 day' * (t.validity - r.remaining))
  FROM (
    -- row_number() renvoie un bigint : sans la conversion, « date - bigint »
    -- n'a pas d'opérateur et l'insertion échoue.
    SELECT id, name, (row_number() OVER (ORDER BY name))::int - 1 AS idx
    FROM drivers WHERE user_id = org
  ) d
  CROSS JOIN (VALUES
    ('permis_conduire',        5475, 0),
    ('aptitude_conduite',      1825, 1),
    ('casier_judiciaire',       365, 2),
    ('formation_sst_psc1',      730, 3),
    ('formation_tpmr',         1825, 4),
    ('formation_eco_conduite', 1095, 5),
    ('visite_medecin',          365, 6)
  ) AS t(type, validity, ord)
  CROSS JOIN LATERAL (
    SELECT (60 + ((d.idx * 37 + t.ord * 53) % GREATEST(t.validity - 120, 1)))::int AS remaining
  ) r;

  -- La visite médicale de Sophie Renard arrive à échéance dans 21 jours :
  -- c'est l'alerte « Documents à renouveler » de la démonstration.
  UPDATE driver_documents
     SET validation_date = CURRENT_DATE - 344, expiry_date = CURRENT_DATE + 21
   WHERE org_id = org AND type = 'visite_medecin'
     AND driver_id = (SELECT id FROM drivers WHERE user_id = org AND name = 'Sophie Renard');

  -- Le casier judiciaire de Pierre Dubois a expiré il y a huit jours : c'est le
  -- second niveau d'alerte, celui qui demande une action immédiate.
  UPDATE driver_documents
     SET validation_date = CURRENT_DATE - 373, expiry_date = CURRENT_DATE - 8
   WHERE org_id = org AND type = 'casier_judiciaire'
     AND driver_id = (SELECT id FROM drivers WHERE user_id = org AND name = 'Pierre Dubois');

  RAISE NOTICE 'Démonstration prête : % véhicules, % conducteurs, % documents, % lavages.',
    (SELECT count(*) FROM vehicles         WHERE user_id = org),
    (SELECT count(*) FROM drivers          WHERE user_id = org),
    (SELECT count(*) FROM driver_documents WHERE org_id  = org),
    (SELECT count(*) FROM wash_records     WHERE user_id = org);
END $$;
