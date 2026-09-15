-- ============================================================
-- Jeu de données de démonstration — Occitrans Services (Toulouse)
-- À exécuter dans le SQL Editor de Supabase, sur un compte DÉDIÉ.
--
-- 15 véhicules, 12 conducteurs, 12 affectations actives, historiques de
-- kilométrage, entretiens, contrôles techniques, lavages et documents.
-- Toutes les dates sont relatives à aujourd'hui : le script reste valable
-- quel que soit le jour de l'enregistrement.
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

  -- ── Véhicules ─────────────────────────────────────────────
  INSERT INTO vehicles (user_id, plate_number, model, mec_date, created_at)
  SELECT org, v.plate, v.model, v.mec, now() - (interval '1 day' * 120)
  FROM (VALUES
    ('AB-123-CD', 'Renault Master', DATE '2021-03-12', 128400),
    ('EF-456-GH', 'Peugeot Boxer', DATE '2020-09-04', 164200),
    ('IJ-789-KL', 'Citroën Jumpy', DATE '2022-01-20', 74300),
    ('MN-012-OP', 'Ford Transit', DATE '2019-06-28', 198700),
    ('QR-345-ST', 'Mercedes Sprinter', DATE '2022-11-15', 61250),
    ('UV-678-WX', 'Renault Trafic', DATE '2021-07-02', 112900),
    ('YZ-901-AB', 'Peugeot Partner', DATE '2023-02-08', 38600),
    ('CD-234-EF', 'Citroën Berlingo', DATE '2020-04-17', 147500),
    ('GH-567-IJ', 'Fiat Ducato', DATE '2018-10-30', 221300),
    ('KL-890-MN', 'Renault Kangoo', DATE '2023-05-22', 27400),
    ('OP-123-QR', 'Ford Custom', DATE '2021-12-09', 96800),
    ('ST-456-UV', 'Opel Vivaro', DATE '2022-08-14', 68900),
    ('WX-789-YZ', 'Volkswagen Crafter', DATE '2019-11-26', 183200),
    ('AC-012-BD', 'Toyota Proace', DATE '2023-09-05', 19750),
    ('EG-345-FH', 'Mercedes Vito', DATE '2020-02-11', 156400)
  ) AS v(plate, model, mec, km);

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

  -- ── Affectations en cours (12 sur 15 véhicules) ───────────
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

  -- ── Kilométrages : trois relevés par véhicule sur 3 mois ──
  -- Deux relevés minimum sont nécessaires pour que « Utilisation des
  -- véhicules » affiche des barres plutôt qu'un écran vide.
  INSERT INTO mileage_entries (user_id, vehicle_id, mileage, amount, created_at)
  SELECT org, v.id,
         ROUND(v.km - (v.km * 0.055 * s.step))::int,
         CASE WHEN s.step > 0 THEN ROUND((85 + random() * 45)::numeric, 2) ELSE NULL END,
         now() - (interval '1 day' * s.days)
  FROM (
    SELECT ve.id, k.km
    FROM vehicles ve
    JOIN (VALUES
      ('AB-123-CD', 'Renault Master', DATE '2021-03-12', 128400),
    ('EF-456-GH', 'Peugeot Boxer', DATE '2020-09-04', 164200),
    ('IJ-789-KL', 'Citroën Jumpy', DATE '2022-01-20', 74300),
    ('MN-012-OP', 'Ford Transit', DATE '2019-06-28', 198700),
    ('QR-345-ST', 'Mercedes Sprinter', DATE '2022-11-15', 61250),
    ('UV-678-WX', 'Renault Trafic', DATE '2021-07-02', 112900),
    ('YZ-901-AB', 'Peugeot Partner', DATE '2023-02-08', 38600),
    ('CD-234-EF', 'Citroën Berlingo', DATE '2020-04-17', 147500),
    ('GH-567-IJ', 'Fiat Ducato', DATE '2018-10-30', 221300),
    ('KL-890-MN', 'Renault Kangoo', DATE '2023-05-22', 27400),
    ('OP-123-QR', 'Ford Custom', DATE '2021-12-09', 96800),
    ('ST-456-UV', 'Opel Vivaro', DATE '2022-08-14', 68900),
    ('WX-789-YZ', 'Volkswagen Crafter', DATE '2019-11-26', 183200),
    ('AC-012-BD', 'Toyota Proace', DATE '2023-09-05', 19750),
    ('EG-345-FH', 'Mercedes Vito', DATE '2020-02-11', 156400)
    ) AS k(plate, model, mec, km) ON k.plate = ve.plate_number
    WHERE ve.user_id = org
  ) v
  CROSS JOIN (VALUES (2, 88), (1, 44), (0, 4)) AS s(step, days);

  -- ── Contrôles techniques ──────────────────────────────────
  INSERT INTO technical_inspections (user_id, vehicle_id, inspection_date, expiration_date, invoice_amount, created_at)
  SELECT org,
         (SELECT id FROM vehicles WHERE user_id = org AND plate_number = i.plate),
         CURRENT_DATE - i.ago,
         CURRENT_DATE + i.left_days,
         78.00,
         now() - (interval '1 day' * i.ago)
  FROM (VALUES
    ('AB-123-CD', 360, 5),
    ('EF-456-GH', 343, 22),
    ('IJ-789-KL', 250, 115),
    ('MN-012-OP', 120, 245),
    ('QR-345-ST', 60, 305),
    ('UV-678-WX', 200, 165),
    ('YZ-901-AB', 30, 335),
    ('CD-234-EF', 290, 75),
    ('GH-567-IJ', 150, 215),
    ('KL-890-MN', 95, 270),
    ('OP-123-QR', 310, 55),
    ('ST-456-UV', 45, 320),
    ('WX-789-YZ', 220, 145)
  ) AS i(plate, ago, left_days);

  -- ── Entretiens réalisés ───────────────────────────────────
  INSERT INTO maintenance_records (user_id, vehicle_id, date, mileage, status, issue_description, invoice_amount, created_at)
  SELECT org,
         (SELECT id FROM vehicles WHERE user_id = org AND plate_number = m.plate),
         CURRENT_DATE - m.ago, m.km, m.status, m.issue, m.amount,
         now() - (interval '1 day' * m.ago)
  FROM (VALUES
    ('AB-123-CD', 350, 118000, 'OK',      'Vidange + filtre à huile',             289.90),
    ('EF-456-GH', 120, 152000, 'OK',      'Révision constructeur',                412.50),
    ('MN-012-OP',  12, 196400, 'PROBLEM', 'Bruit de roulement à l''avant droit',   0.00),
    ('GH-567-IJ',   6, 219800, 'OK',      'Distribution + courroie',              640.00),
    ('QR-345-ST',  40,  58900, 'OK',      'Plaquettes avant',                     198.00),
    ('UV-678-WX', 200, 104500, 'OK',      'Vidange + filtres',                    327.40)
  ) AS m(plate, ago, km, status, issue, amount);

  -- ── Plannings d'entretien ─────────────────────────────────
  -- Le Renault Master a été entretenu il y a 350 jours pour un intervalle de
  -- 12 mois : sa prochaine échéance tombe dans une quinzaine de jours.
  INSERT INTO maintenance_schedules (user_id, vehicle_id, interval_months, interval_km, notes, created_at)
  SELECT org,
         (SELECT id FROM vehicles WHERE user_id = org AND plate_number = s.plate),
         s.months, s.km, s.notes, now() - (interval '1 day' * 100)
  FROM (VALUES
    ('AB-123-CD', 12, 20000, 'Vidange + filtres'),
    ('EF-456-GH', 12, 25000, 'Révision constructeur'),
    ('MN-012-OP', 12, 20000, 'Vidange + plaquettes'),
    ('GH-567-IJ', 12, 30000, 'Révision complète'),
    ('QR-345-ST', 24, 30000, 'Entretien constructeur'),
    ('UV-678-WX', 12, 20000, 'Vidange + filtres')
  ) AS s(plate, months, km, notes);

  -- ── Lavages du mois ───────────────────────────────────────
  INSERT INTO wash_records (user_id, vehicle_id, driver_id, date, amount, created_at)
  SELECT org,
         (SELECT id FROM vehicles WHERE user_id = org AND plate_number = w.plate),
         (SELECT id FROM drivers  WHERE user_id = org AND name = w.driver),
         CURRENT_DATE - w.ago, w.amount, now() - (interval '1 day' * w.ago)
  FROM (VALUES
    ('AB-123-CD', 'Karim Aïssa',    3, 18.00),
    ('IJ-789-KL', 'Marc Lefebvre',  8, 15.50),
    ('QR-345-ST', 'Thomas Sanchez', 14, 22.00)
  ) AS w(plate, driver, ago, amount);

  -- ── Documents conducteurs ─────────────────────────────────
  -- La visite médicale de Sophie Renard arrive à échéance dans 21 jours :
  -- c'est l'alerte « conducteur » de la démonstration.
  INSERT INTO driver_documents (org_id, driver_id, type, validation_date, expiry_date, created_at)
  SELECT org,
         (SELECT id FROM drivers WHERE user_id = org AND name = d.driver),
         d.type, CURRENT_DATE - d.ago, CURRENT_DATE + d.left_days,
         now() - (interval '1 day' * d.ago)
  FROM (VALUES
    ('Sophie Renard', 'medical', 344, 21),
    ('Sophie Renard', 'permis',  400, 1200),
    ('Karim Aïssa',   'permis',  300, 1500),
    ('Karim Aïssa',   'medical', 120, 1700),
    ('Marc Lefebvre', 'permis',  500, 900),
    ('Amel Benali',   'permis',  260, 1100),
    ('Amel Benali',   'sst',     180, 550)
  ) AS d(driver, type, ago, left_days);

  RAISE NOTICE 'Démonstration prête : % véhicules, % conducteurs.',
    (SELECT count(*) FROM vehicles WHERE user_id = org),
    (SELECT count(*) FROM drivers  WHERE user_id = org);
END $$;
