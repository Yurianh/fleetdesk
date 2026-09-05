import { useAuth } from './AuthContext'

// Fleet-manager business sectors captured at onboarding. Each sector sets sane
// defaults for which optional modules are shown, so a user isn't cluttered with
// features irrelevant to their activity. Defaults are only defaults: every
// module can be re-enabled (or disabled) from Settings › Modules.
export const ACTIVITIES = {
  transport: { label: 'Transport de marchandises', desc: 'Logistique, livraison, messagerie' },
  vtc:       { label: 'VTC / Taxi',                desc: 'Transport de personnes' },
  btp:       { label: 'BTP / Artisan',             desc: 'Chantiers, utilitaires' },
  services:  { label: 'Services / flotte de fonction', desc: 'Commerciaux, véhicules de société' },
  autre:     { label: 'Autre / généraliste',       desc: 'Un peu de tout' },
}

// Optional modules the user can toggle. Core modules (vehicles, drivers, CT,
// maintenance, mileage, fuel) are always on and not listed here.
export const MODULES = [
  { key: 'washings',         label: 'Lavages',              desc: 'Suivi des lavages et justificatifs' },
  { key: 'transportLicense', label: 'Licence de transport', desc: 'Document véhicule : licence de transport' },
]

// Per-sector default visibility for each optional module.
const DEFAULTS = {
  transport: { washings: true,  transportLicense: true,  proDriverDocs: true  },
  vtc:       { washings: true,  transportLicense: true,  proDriverDocs: true  },
  btp:       { washings: false, transportLicense: false, proDriverDocs: false },
  services:  { washings: false, transportLicense: false, proDriverDocs: false },
  autre:     { washings: true,  transportLicense: true,  proDriverDocs: true  },
}

export function activityDefaults(activity) {
  return DEFAULTS[activity] ?? DEFAULTS.autre
}

// Effective visibility for a module = explicit user override, else the sector
// default. Collaborators (org members) inherit an all-on view — we don't hide
// modules for them since the owner's sector isn't on their token.
export function useFeatures() {
  const { user } = useAuth()
  const isCollaborator = !!user?.user_metadata?.org_id
  if (isCollaborator) return { has: () => true, activity: null, overrides: {} }

  const activity = user?.user_metadata?.activity ?? 'autre'
  const defaults = activityDefaults(activity)
  const overrides = user?.user_metadata?.feature_overrides ?? {}
  const has = (key) => (key in overrides ? !!overrides[key] : (defaults[key] ?? true))
  return { has, activity, overrides }
}

// Convenience hook for a single module.
export function useFeature(key) {
  return useFeatures().has(key)
}
