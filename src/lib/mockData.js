// ─── Demo / mockup data ───────────────────────────────────────────────────────
// Used when VITE_DEMO_MODE=true. All dates relative to 2026-06-05.

const ORG = 'demo-org-001'

// ─── Vehicles ─────────────────────────────────────────────────────────────────
export const vehicles = [
  { id: 'v1', user_id: ORG, plate_number: 'AB-123-CD', make: 'Renault',    model: 'Kangoo',   year: 2021, status: 'active',          created_at: '2024-01-10T09:00:00Z', registration_card_url: null, notes: null },
  { id: 'v2', user_id: ORG, plate_number: 'EF-456-GH', make: 'Peugeot',    model: 'Partner',  year: 2020, status: 'active',          created_at: '2024-01-12T09:00:00Z', registration_card_url: null, notes: null },
  { id: 'v3', user_id: ORG, plate_number: 'IJ-789-KL', make: 'Citroën',    model: 'Berlingo', year: 2022, status: 'active',          created_at: '2024-02-03T09:00:00Z', registration_card_url: null, notes: null },
  { id: 'v4', user_id: ORG, plate_number: 'LM-012-NO', make: 'Ford',       model: 'Transit',  year: 2019, status: 'en maintenance',  created_at: '2024-02-20T09:00:00Z', registration_card_url: null, notes: 'Embrayage en cours de remplacement' },
  { id: 'v5', user_id: ORG, plate_number: 'PQ-345-RS', make: 'Volkswagen', model: 'Caddy',    year: 2021, status: 'active',          created_at: '2024-03-05T09:00:00Z', registration_card_url: null, notes: null },
  { id: 'v6', user_id: ORG, plate_number: 'TU-678-VW', make: 'Renault',    model: 'Trafic',   year: 2020, status: 'active',          created_at: '2024-03-18T09:00:00Z', registration_card_url: null, notes: null },
  { id: 'v7', user_id: ORG, plate_number: 'XY-901-ZA', make: 'Peugeot',    model: 'Expert',   year: 2023, status: 'active',          created_at: '2024-06-01T09:00:00Z', registration_card_url: null, notes: null },
  { id: 'v8', user_id: ORG, plate_number: 'BC-234-DE', make: 'Mercedes',   model: 'Sprinter', year: 2018, status: 'hors service',    created_at: '2023-11-15T09:00:00Z', registration_card_url: null, notes: 'Moteur HS — en attente de décision' },
]

// ─── Drivers ──────────────────────────────────────────────────────────────────
export const drivers = [
  { id: 'd1', user_id: ORG, name: 'Thomas Dubois',    email: 'thomas.dubois@example.com',    phone: '06 12 34 56 78', date_of_birth: '1985-03-14', address: '12 rue de la Paix, 75001 Paris',         employee_id: 'EMP-001', created_at: '2024-01-10T10:00:00Z' },
  { id: 'd2', user_id: ORG, name: 'Marie Lefebvre',   email: 'marie.lefebvre@example.com',   phone: '06 23 45 67 89', date_of_birth: '1990-07-22', address: '45 avenue Victor Hugo, 69002 Lyon',      employee_id: 'EMP-002', created_at: '2024-01-12T10:00:00Z' },
  { id: 'd3', user_id: ORG, name: 'Antoine Martin',   email: 'antoine.martin@example.com',   phone: '06 34 56 78 90', date_of_birth: '1978-11-05', address: '8 boulevard Gambetta, 13001 Marseille',  employee_id: 'EMP-003', created_at: '2024-02-03T10:00:00Z' },
  { id: 'd4', user_id: ORG, name: 'Sophie Bernard',   email: 'sophie.bernard@example.com',   phone: '06 45 67 89 01', date_of_birth: '1992-04-18', address: '22 rue du Commerce, 31000 Toulouse',     employee_id: 'EMP-004', created_at: '2024-02-20T10:00:00Z' },
  { id: 'd5', user_id: ORG, name: 'Lucas Moreau',     email: 'lucas.moreau@example.com',     phone: '06 56 78 90 12', date_of_birth: '1988-09-30', address: '3 place de la République, 44000 Nantes', employee_id: 'EMP-005', created_at: '2024-03-05T10:00:00Z' },
  { id: 'd6', user_id: ORG, name: 'Emma Petit',       email: 'emma.petit@example.com',       phone: '06 67 89 01 23', date_of_birth: '1995-01-08', address: '17 rue des Fleurs, 33000 Bordeaux',      employee_id: 'EMP-006', created_at: '2024-03-18T10:00:00Z' },
]

// ─── Assignments ──────────────────────────────────────────────────────────────
export const assignments = [
  // Active assignments
  { id: 'a1', user_id: ORG, driver_id: 'd1', vehicle_id: 'v1', assigned_at: '2024-01-15T08:00:00Z', ended_at: null },
  { id: 'a2', user_id: ORG, driver_id: 'd2', vehicle_id: 'v2', assigned_at: '2024-01-20T08:00:00Z', ended_at: null },
  { id: 'a3', user_id: ORG, driver_id: 'd3', vehicle_id: 'v3', assigned_at: '2024-02-10T08:00:00Z', ended_at: null },
  { id: 'a4', user_id: ORG, driver_id: 'd4', vehicle_id: 'v5', assigned_at: '2024-03-01T08:00:00Z', ended_at: null },
  { id: 'a5', user_id: ORG, driver_id: 'd5', vehicle_id: 'v6', assigned_at: '2024-03-20T08:00:00Z', ended_at: null },
  // Past assignments
  { id: 'a6', user_id: ORG, driver_id: 'd1', vehicle_id: 'v4', assigned_at: '2023-08-01T08:00:00Z', ended_at: '2024-01-14T17:00:00Z' },
  { id: 'a7', user_id: ORG, driver_id: 'd6', vehicle_id: 'v7', assigned_at: '2024-06-01T08:00:00Z', ended_at: '2025-11-30T17:00:00Z' },
  { id: 'a8', user_id: ORG, driver_id: 'd2', vehicle_id: 'v8', assigned_at: '2023-06-15T08:00:00Z', ended_at: '2024-01-19T17:00:00Z' },
]

// ─── Mileage Entries ──────────────────────────────────────────────────────────
// Realistic monthly entries — each vehicle has a baseline + monthly delta
const _mileBase = { v1: 28000, v2: 41000, v3: 15000, v4: 87000, v5: 32000, v6: 54000, v7: 8000, v8: 112000 }
const _mileMonthly = { v1: 2100, v2: 1800, v3: 2400, v4: 1200, v5: 1950, v6: 2300, v7: 1600, v8: 0 }

export const mileageEntries = (() => {
  const entries = []
  let id = 1
  const months = ['2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
                  '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']
  Object.keys(_mileBase).forEach(vid => {
    months.forEach((month, i) => {
      if (vid === 'v8' && i > 0) return // Sprinter HS, no new km
      const mileage = _mileBase[vid] + _mileMonthly[vid] * (i + 1)
      entries.push({
        id: `me${id++}`,
        user_id: ORG,
        vehicle_id: vid,
        mileage,
        date: `${month}-01`,
        created_at: `${month}-01T10:00:00Z`,
        notes: null,
      })
    })
  })
  return entries.sort((a, b) => b.date.localeCompare(a.date))
})()

// ─── Maintenance Records ──────────────────────────────────────────────────────
export const maintenanceRecords = [
  { id: 'mr1',  user_id: ORG, vehicle_id: 'v1', type: 'Vidange + filtre à huile',       date: '2026-03-15', cost: 89,  notes: 'Huile 5W30 Full Synthetic', created_at: '2026-03-15T11:00:00Z' },
  { id: 'mr2',  user_id: ORG, vehicle_id: 'v1', type: 'Remplacement plaquettes avant',  date: '2025-11-20', cost: 145, notes: null, created_at: '2025-11-20T11:00:00Z' },
  { id: 'mr3',  user_id: ORG, vehicle_id: 'v2', type: 'Vidange + filtre à huile',       date: '2026-01-08', cost: 92,  notes: null, created_at: '2026-01-08T11:00:00Z' },
  { id: 'mr4',  user_id: ORG, vehicle_id: 'v2', type: 'Remplacement courroie distribution', date: '2025-09-12', cost: 380, notes: 'Kit complet avec pompe à eau', created_at: '2025-09-12T11:00:00Z' },
  { id: 'mr5',  user_id: ORG, vehicle_id: 'v3', type: 'Vidange + filtre à huile',       date: '2026-04-22', cost: 87,  notes: null, created_at: '2026-04-22T11:00:00Z' },
  { id: 'mr6',  user_id: ORG, vehicle_id: 'v4', type: 'Remplacement embrayage',          date: '2026-05-20', cost: 890, notes: 'Kit embrayage complet LUK', created_at: '2026-05-20T11:00:00Z' },
  { id: 'mr7',  user_id: ORG, vehicle_id: 'v4', type: 'Vidange + filtre à huile',       date: '2025-12-10', cost: 95,  notes: null, created_at: '2025-12-10T11:00:00Z' },
  { id: 'mr8',  user_id: ORG, vehicle_id: 'v5', type: 'Vidange + filtre à huile',       date: '2026-02-14', cost: 88,  notes: null, created_at: '2026-02-14T11:00:00Z' },
  { id: 'mr9',  user_id: ORG, vehicle_id: 'v5', type: 'Pneus hiver → été',              date: '2026-03-28', cost: 60,  notes: '4 pneus montés + équilibrés', created_at: '2026-03-28T11:00:00Z' },
  { id: 'mr10', user_id: ORG, vehicle_id: 'v6', type: 'Vidange + filtre à huile',       date: '2026-04-05', cost: 91,  notes: null, created_at: '2026-04-05T11:00:00Z' },
  { id: 'mr11', user_id: ORG, vehicle_id: 'v6', type: 'Remplacement amortisseurs avant', date: '2025-10-30', cost: 420, notes: 'Monroe OE Spectrum', created_at: '2025-10-30T11:00:00Z' },
  { id: 'mr12', user_id: ORG, vehicle_id: 'v7', type: 'Vidange première',               date: '2025-12-20', cost: 95,  notes: '1ère vidange à 15 000 km', created_at: '2025-12-20T11:00:00Z' },
  { id: 'mr13', user_id: ORG, vehicle_id: 'v3', type: 'Filtre à air',                   date: '2026-04-22', cost: 28,  notes: null, created_at: '2026-04-22T11:30:00Z' },
  { id: 'mr14', user_id: ORG, vehicle_id: 'v2', type: 'Pneus hiver → été',              date: '2026-03-30', cost: 60,  notes: null, created_at: '2026-03-30T11:00:00Z' },
]

// ─── Technical Inspections ────────────────────────────────────────────────────
export const technicalInspections = [
  { id: 'ti1', user_id: ORG, vehicle_id: 'v1', inspection_date: '2025-04-10', expiry_date: '2027-04-10', result: 'pass', notes: null, created_at: '2025-04-10T14:00:00Z' },
  { id: 'ti2', user_id: ORG, vehicle_id: 'v2', inspection_date: '2024-11-05', expiry_date: '2026-11-05', result: 'pass', notes: null, created_at: '2024-11-05T14:00:00Z' },
  { id: 'ti3', user_id: ORG, vehicle_id: 'v3', inspection_date: '2026-01-20', expiry_date: '2028-01-20', result: 'pass', notes: null, created_at: '2026-01-20T14:00:00Z' },
  { id: 'ti4', user_id: ORG, vehicle_id: 'v4', inspection_date: '2025-06-15', expiry_date: '2026-06-15', result: 'advisory', notes: 'Avis : fuites légères direction assistée', created_at: '2025-06-15T14:00:00Z' },
  { id: 'ti5', user_id: ORG, vehicle_id: 'v5', inspection_date: '2025-08-22', expiry_date: '2027-08-22', result: 'pass', notes: null, created_at: '2025-08-22T14:00:00Z' },
  { id: 'ti6', user_id: ORG, vehicle_id: 'v6', inspection_date: '2026-02-18', expiry_date: '2028-02-18', result: 'pass', notes: null, created_at: '2026-02-18T14:00:00Z' },
  { id: 'ti7', user_id: ORG, vehicle_id: 'v7', inspection_date: '2026-05-03', expiry_date: '2028-05-03', result: 'pass', notes: 'Véhicule neuf, premier CT', created_at: '2026-05-03T14:00:00Z' },
  { id: 'ti8', user_id: ORG, vehicle_id: 'v8', inspection_date: '2024-05-20', expiry_date: '2026-05-20', result: 'fail', notes: 'Refus : freins arrière insuffisants, fuite carburant', created_at: '2024-05-20T14:00:00Z' },
]

// ─── Wash Records ─────────────────────────────────────────────────────────────
export const washRecords = [
  { id: 'wr1',  user_id: ORG, vehicle_id: 'v1', date: '2026-05-28', amount: 12,  type: 'Lavage automatique', created_at: '2026-05-28T16:00:00Z' },
  { id: 'wr2',  user_id: ORG, vehicle_id: 'v1', date: '2026-04-15', amount: 25,  type: 'Lavage haute pression', created_at: '2026-04-15T16:00:00Z' },
  { id: 'wr3',  user_id: ORG, vehicle_id: 'v2', date: '2026-05-30', amount: 12,  type: 'Lavage automatique', created_at: '2026-05-30T16:00:00Z' },
  { id: 'wr4',  user_id: ORG, vehicle_id: 'v2', date: '2026-03-10', amount: 35,  type: 'Nettoyage intérieur complet', created_at: '2026-03-10T16:00:00Z' },
  { id: 'wr5',  user_id: ORG, vehicle_id: 'v3', date: '2026-06-01', amount: 12,  type: 'Lavage automatique', created_at: '2026-06-01T16:00:00Z' },
  { id: 'wr6',  user_id: ORG, vehicle_id: 'v3', date: '2026-04-08', amount: 20,  type: 'Lavage haute pression', created_at: '2026-04-08T16:00:00Z' },
  { id: 'wr7',  user_id: ORG, vehicle_id: 'v5', date: '2026-05-20', amount: 12,  type: 'Lavage automatique', created_at: '2026-05-20T16:00:00Z' },
  { id: 'wr8',  user_id: ORG, vehicle_id: 'v6', date: '2026-05-25', amount: 18,  type: 'Lavage haute pression', created_at: '2026-05-25T16:00:00Z' },
  { id: 'wr9',  user_id: ORG, vehicle_id: 'v7', date: '2026-05-15', amount: 12,  type: 'Lavage automatique', created_at: '2026-05-15T16:00:00Z' },
  { id: 'wr10', user_id: ORG, vehicle_id: 'v1', date: '2026-03-05', amount: 12,  type: 'Lavage automatique', created_at: '2026-03-05T16:00:00Z' },
]

// ─── Maintenance Schedules ────────────────────────────────────────────────────
export const maintenanceSchedules = [
  { id: 'ms1', user_id: ORG, vehicle_id: 'v1', task: 'Vidange + filtre à huile',    interval_km: 15000, last_done_km: 51100, last_done_date: '2026-03-15', notes: null, created_at: '2024-01-15T10:00:00Z' },
  { id: 'ms2', user_id: ORG, vehicle_id: 'v1', task: 'Plaquettes de frein',         interval_km: 40000, last_done_km: 39200, last_done_date: '2025-11-20', notes: null, created_at: '2024-01-15T10:00:00Z' },
  { id: 'ms3', user_id: ORG, vehicle_id: 'v2', task: 'Vidange + filtre à huile',    interval_km: 15000, last_done_km: 72600, last_done_date: '2026-01-08', notes: null, created_at: '2024-01-20T10:00:00Z' },
  { id: 'ms4', user_id: ORG, vehicle_id: 'v2', task: 'Courroie de distribution',    interval_km: 120000, last_done_km: 63000, last_done_date: '2025-09-12', notes: 'Kit complet', created_at: '2024-01-20T10:00:00Z' },
  { id: 'ms5', user_id: ORG, vehicle_id: 'v3', task: 'Vidange + filtre à huile',    interval_km: 15000, last_done_km: 42800, last_done_date: '2026-04-22', notes: null, created_at: '2024-02-05T10:00:00Z' },
  { id: 'ms6', user_id: ORG, vehicle_id: 'v4', task: 'Vidange + filtre à huile',    interval_km: 15000, last_done_km: 98400, last_done_date: '2025-12-10', notes: null, created_at: '2024-02-22T10:00:00Z' },
  { id: 'ms7', user_id: ORG, vehicle_id: 'v5', task: 'Vidange + filtre à huile',    interval_km: 15000, last_done_km: 47650, last_done_date: '2026-02-14', notes: null, created_at: '2024-03-07T10:00:00Z' },
  { id: 'ms8', user_id: ORG, vehicle_id: 'v6', task: 'Vidange + filtre à huile',    interval_km: 15000, last_done_km: 72600, last_done_date: '2026-04-05', notes: null, created_at: '2024-03-20T10:00:00Z' },
  { id: 'ms9', user_id: ORG, vehicle_id: 'v6', task: 'Amortisseurs',               interval_km: 80000, last_done_km: 54000, last_done_date: '2025-10-30', notes: null, created_at: '2024-03-20T10:00:00Z' },
  { id: 'ms10', user_id: ORG, vehicle_id: 'v7', task: 'Vidange + filtre à huile',   interval_km: 15000, last_done_km: 15000, last_done_date: '2025-12-20', notes: null, created_at: '2024-06-02T10:00:00Z' },
]

// ─── Driver Documents ─────────────────────────────────────────────────────────
export const allDriverDocuments = [
  // Thomas Dubois — d1 — mostly up to date
  { id: 'dd1',  driver_id: 'd1', org_id: ORG, type: 'aptitude_conduite',     validation_date: '2023-03-10', expiry_date: '2028-03-10', created_at: '2023-03-10T10:00:00Z' },
  { id: 'dd2',  driver_id: 'd1', org_id: ORG, type: 'casier_judiciaire',     validation_date: '2025-11-20', expiry_date: '2026-11-20', created_at: '2025-11-20T10:00:00Z' },
  { id: 'dd3',  driver_id: 'd1', org_id: ORG, type: 'formation_sst_psc1',    validation_date: '2024-09-05', expiry_date: '2026-09-05', created_at: '2024-09-05T10:00:00Z' },
  { id: 'dd4',  driver_id: 'd1', org_id: ORG, type: 'formation_tpmr',        validation_date: '2022-06-15', expiry_date: '2027-06-15', created_at: '2022-06-15T10:00:00Z' },
  { id: 'dd5',  driver_id: 'd1', org_id: ORG, type: 'visite_medecin',        validation_date: '2025-04-01', expiry_date: '2026-04-01', created_at: '2025-04-01T10:00:00Z' }, // EXPIRED
  { id: 'dd6',  driver_id: 'd1', org_id: ORG, type: 'formation_eco_conduite',validation_date: '2023-10-12', expiry_date: '2026-10-12', created_at: '2023-10-12T10:00:00Z' },

  // Marie Lefebvre — d2 — fully compliant
  { id: 'dd7',  driver_id: 'd2', org_id: ORG, type: 'aptitude_conduite',     validation_date: '2024-01-15', expiry_date: '2029-01-15', created_at: '2024-01-15T10:00:00Z' },
  { id: 'dd8',  driver_id: 'd2', org_id: ORG, type: 'casier_judiciaire',     validation_date: '2026-02-10', expiry_date: '2027-02-10', created_at: '2026-02-10T10:00:00Z' },
  { id: 'dd9',  driver_id: 'd2', org_id: ORG, type: 'formation_sst_psc1',    validation_date: '2025-03-20', expiry_date: '2027-03-20', created_at: '2025-03-20T10:00:00Z' },
  { id: 'dd10', driver_id: 'd2', org_id: ORG, type: 'formation_tpmr',        validation_date: '2023-11-08', expiry_date: '2028-11-08', created_at: '2023-11-08T10:00:00Z' },
  { id: 'dd11', driver_id: 'd2', org_id: ORG, type: 'visite_medecin',        validation_date: '2026-01-20', expiry_date: '2027-01-20', created_at: '2026-01-20T10:00:00Z' },
  { id: 'dd12', driver_id: 'd2', org_id: ORG, type: 'formation_eco_conduite',validation_date: '2024-07-03', expiry_date: '2026-07-03', created_at: '2024-07-03T10:00:00Z' }, // expiring soon

  // Antoine Martin — d3 — 1 expired, 1 missing
  { id: 'dd13', driver_id: 'd3', org_id: ORG, type: 'aptitude_conduite',     validation_date: '2021-05-12', expiry_date: '2026-05-12', created_at: '2021-05-12T10:00:00Z' }, // EXPIRED
  { id: 'dd14', driver_id: 'd3', org_id: ORG, type: 'casier_judiciaire',     validation_date: '2025-08-25', expiry_date: '2026-08-25', created_at: '2025-08-25T10:00:00Z' },
  { id: 'dd15', driver_id: 'd3', org_id: ORG, type: 'formation_sst_psc1',    validation_date: '2024-04-18', expiry_date: '2026-04-18', created_at: '2024-04-18T10:00:00Z' }, // EXPIRED
  { id: 'dd16', driver_id: 'd3', org_id: ORG, type: 'formation_tpmr',        validation_date: '2022-09-30', expiry_date: '2027-09-30', created_at: '2022-09-30T10:00:00Z' },
  // visite_medecin missing for d3
  { id: 'dd17', driver_id: 'd3', org_id: ORG, type: 'formation_eco_conduite',validation_date: '2024-02-14', expiry_date: '2026-09-14', created_at: '2024-02-14T10:00:00Z' },

  // Sophie Bernard — d4 — up to date
  { id: 'dd18', driver_id: 'd4', org_id: ORG, type: 'aptitude_conduite',     validation_date: '2024-06-01', expiry_date: '2029-06-01', created_at: '2024-06-01T10:00:00Z' },
  { id: 'dd19', driver_id: 'd4', org_id: ORG, type: 'casier_judiciaire',     validation_date: '2025-12-05', expiry_date: '2026-12-05', created_at: '2025-12-05T10:00:00Z' },
  { id: 'dd20', driver_id: 'd4', org_id: ORG, type: 'formation_sst_psc1',    validation_date: '2025-01-22', expiry_date: '2027-01-22', created_at: '2025-01-22T10:00:00Z' },
  { id: 'dd21', driver_id: 'd4', org_id: ORG, type: 'formation_tpmr',        validation_date: '2023-04-10', expiry_date: '2028-04-10', created_at: '2023-04-10T10:00:00Z' },
  { id: 'dd22', driver_id: 'd4', org_id: ORG, type: 'visite_medecin',        validation_date: '2026-03-15', expiry_date: '2027-03-15', created_at: '2026-03-15T10:00:00Z' },
  { id: 'dd23', driver_id: 'd4', org_id: ORG, type: 'formation_eco_conduite',validation_date: '2025-05-20', expiry_date: '2027-05-20', created_at: '2025-05-20T10:00:00Z' },

  // Lucas Moreau — d5 — 1 expiring soon
  { id: 'dd24', driver_id: 'd5', org_id: ORG, type: 'aptitude_conduite',     validation_date: '2022-10-08', expiry_date: '2027-10-08', created_at: '2022-10-08T10:00:00Z' },
  { id: 'dd25', driver_id: 'd5', org_id: ORG, type: 'casier_judiciaire',     validation_date: '2026-05-30', expiry_date: '2027-05-30', created_at: '2026-05-30T10:00:00Z' },
  { id: 'dd26', driver_id: 'd5', org_id: ORG, type: 'formation_sst_psc1',    validation_date: '2025-07-14', expiry_date: '2027-07-14', created_at: '2025-07-14T10:00:00Z' },
  { id: 'dd27', driver_id: 'd5', org_id: ORG, type: 'formation_tpmr',        validation_date: '2024-03-25', expiry_date: '2029-03-25', created_at: '2024-03-25T10:00:00Z' },
  { id: 'dd28', driver_id: 'd5', org_id: ORG, type: 'visite_medecin',        validation_date: '2025-09-10', expiry_date: '2026-07-10', created_at: '2025-09-10T10:00:00Z' }, // expiring soon
  { id: 'dd29', driver_id: 'd5', org_id: ORG, type: 'formation_eco_conduite',validation_date: '2024-11-05', expiry_date: '2027-11-05', created_at: '2024-11-05T10:00:00Z' },

  // Emma Petit — d6 — new, some docs missing
  { id: 'dd30', driver_id: 'd6', org_id: ORG, type: 'aptitude_conduite',     validation_date: '2025-10-01', expiry_date: '2030-10-01', created_at: '2025-10-01T10:00:00Z' },
  { id: 'dd31', driver_id: 'd6', org_id: ORG, type: 'casier_judiciaire',     validation_date: '2026-04-20', expiry_date: '2027-04-20', created_at: '2026-04-20T10:00:00Z' },
  // formation_sst_psc1 missing
  // formation_tpmr missing
  { id: 'dd32', driver_id: 'd6', org_id: ORG, type: 'visite_medecin',        validation_date: '2026-01-08', expiry_date: '2027-01-08', created_at: '2026-01-08T10:00:00Z' },
  // formation_eco_conduite missing
]

// ─── Activity Log ─────────────────────────────────────────────────────────────
export const activityLog = [
  { id: 'al1',  org_id: ORG, user_id: 'u1', user_name: 'Thomas Dubois', action: 'createMileageEntry',       entity_type: 'mileage',   entity_id: 'me_latest', entity_label: '55 300 km',                    created_at: '2026-06-01T08:12:00Z' },
  { id: 'al2',  org_id: ORG, user_id: 'u1', user_name: 'Thomas Dubois', action: 'createWashRecord',         entity_type: 'wash',      entity_id: 'wr3',       entity_label: 'Lavage 12.00 €',               created_at: '2026-05-30T17:00:00Z' },
  { id: 'al3',  org_id: ORG, user_id: 'u0', user_name: 'Admin',         action: 'createMaintenanceRecord',  entity_type: 'maintenance',entity_id: 'mr1',       entity_label: 'Vidange + filtre à huile',      created_at: '2026-05-20T11:30:00Z' },
  { id: 'al4',  org_id: ORG, user_id: 'u0', user_name: 'Admin',         action: 'createTechnicalInspection',entity_type: 'inspection', entity_id: 'ti7',       entity_label: 'Contrôle technique',           created_at: '2026-05-03T14:30:00Z' },
  { id: 'al5',  org_id: ORG, user_id: 'u0', user_name: 'Admin',         action: 'createVehicle',            entity_type: 'vehicle',   entity_id: 'v7',        entity_label: 'XY-901-ZA — Expert',          created_at: '2026-05-01T09:00:00Z' },
  { id: 'al6',  org_id: ORG, user_id: 'u0', user_name: 'Admin',         action: 'createAssignment',         entity_type: 'assignment', entity_id: 'a7',       entity_label: '',                             created_at: '2026-04-30T10:00:00Z' },
  { id: 'al7',  org_id: ORG, user_id: 'u0', user_name: 'Admin',         action: 'createMaintenanceRecord',  entity_type: 'maintenance',entity_id: 'mr5',       entity_label: 'Vidange + filtre à huile',      created_at: '2026-04-22T12:00:00Z' },
  { id: 'al8',  org_id: ORG, user_id: 'u0', user_name: 'Admin',         action: 'updateDriver',             entity_type: 'driver',    entity_id: 'd4',        entity_label: '',                             created_at: '2026-04-10T14:00:00Z' },
  { id: 'al9',  org_id: ORG, user_id: 'u0', user_name: 'Admin',         action: 'createMileageEntry',       entity_type: 'mileage',   entity_id: 'me_m',      entity_label: '74 400 km',                    created_at: '2026-04-01T09:00:00Z' },
  { id: 'al10', org_id: ORG, user_id: 'u0', user_name: 'Admin',         action: 'createMaintenanceRecord',  entity_type: 'maintenance',entity_id: 'mr10',      entity_label: 'Vidange + filtre à huile',      created_at: '2026-04-05T12:00:00Z' },
]

// ─── Mock user (bypasses Supabase auth) ──────────────────────────────────────
export const mockUser = {
  id: 'u0',
  email: 'demo@fleetdesk.fr',
  user_metadata: {
    full_name: 'Thomas Dubois',
    onboarding_complete: true,
    plan: 'pro',
    trial_ends_at: null,
  },
  app_metadata: {},
  created_at: '2024-01-01T00:00:00Z',
}
