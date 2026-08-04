import { useState } from 'react'
import {
  LayoutDashboard, Truck, Users, ArrowLeftRight, Gauge, Wrench,
  ClipboardCheck, Droplets, Sparkles, Check, ArrowRight, RotateCcw, Play,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Self-contained, sandboxed tutorials. Each section renders a REPLICA of its
// form. The user fills it and "validates" — nothing is ever sent to the DB, it
// is purely a rehearsal ("action fantôme"). No real page or mutation involved.
const VEHICLES = ['AB-123-CD — Renault Kangoo', 'CD-456-EF — Peugeot Partner']
const DRIVERS = ['Jean Dupont', 'Marie Martin']

const TUTORIALS = [
  {
    id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard,
    intro: 'Le tableau de bord réunit vos indicateurs clés et les alertes à traiter en priorité (documents, contrôles techniques, entretiens à venir).',
    fields: [],
    submitLabel: "J'ai compris",
    success: 'Vous savez repérer vos indicateurs et vos alertes.',
  },
  {
    id: 'vehicles', label: 'Véhicules', icon: Truck,
    intro: 'Ajoutez et suivez chaque véhicule de votre flotte.',
    fields: [
      { key: 'plate', label: 'Plaque', type: 'text', example: 'AB-123-CD' },
      { key: 'model', label: 'Modèle', type: 'text', example: 'Renault Kangoo' },
      { key: 'km', label: 'Kilométrage', type: 'number', example: '45000' },
    ],
    success: 'Véhicule d’exemple ajouté. En vrai, il apparaîtrait dans « Véhicules ».',
  },
  {
    id: 'drivers', label: 'Conducteurs', icon: Users,
    intro: 'Créez la fiche de vos conducteurs et gérez leurs documents réglementaires.',
    fields: [
      { key: 'name', label: 'Nom complet', type: 'text', example: 'Jean Dupont' },
      { key: 'phone', label: 'Téléphone', type: 'text', example: '06 12 34 56 78' },
      { key: 'email', label: 'Email', type: 'text', example: 'jean.dupont@email.com' },
    ],
    success: 'Conducteur d’exemple créé. En vrai, il apparaîtrait dans « Conducteurs ».',
  },
  {
    id: 'assignments', label: 'Affectations', icon: ArrowLeftRight,
    intro: 'Affectez un conducteur à un véhicule. L’historique se construit automatiquement.',
    fields: [
      { key: 'vehicle', label: 'Véhicule', type: 'select', options: VEHICLES, example: VEHICLES[0] },
      { key: 'driver', label: 'Conducteur', type: 'select', options: DRIVERS, example: DRIVERS[0] },
    ],
    success: 'Affectation d’exemple enregistrée pour la démo.',
  },
  {
    id: 'mileage', label: 'Kilométrage', icon: Gauge,
    intro: 'Relevez le kilométrage d’un véhicule. Les écarts alimentent les prévisions d’entretien.',
    fields: [
      { key: 'vehicle', label: 'Véhicule', type: 'select', options: VEHICLES, example: VEHICLES[0] },
      { key: 'km', label: 'Kilométrage actuel', type: 'number', example: '46200' },
    ],
    success: 'Relevé d’exemple pris en compte pour la démo.',
  },
  {
    id: 'maintenance', label: 'Maintenance', icon: Wrench,
    intro: 'Consignez les entretiens et réparations, avec leur coût.',
    fields: [
      { key: 'vehicle', label: 'Véhicule', type: 'select', options: VEHICLES, example: VEHICLES[0] },
      { key: 'type', label: 'Type', type: 'select', options: ['Vidange', 'Pneus', 'Freins', 'Révision'], example: 'Vidange' },
      { key: 'cost', label: 'Coût (€)', type: 'number', example: '180' },
    ],
    success: 'Entretien d’exemple consigné pour la démo.',
  },
  {
    id: 'inspections', label: 'Contrôles tech.', icon: ClipboardCheck,
    intro: 'Suivez les contrôles techniques et soyez alerté avant l’échéance.',
    fields: [
      { key: 'vehicle', label: 'Véhicule', type: 'select', options: VEHICLES, example: VEHICLES[0] },
      { key: 'date', label: 'Date du contrôle', type: 'date', example: '' },
      { key: 'result', label: 'Résultat', type: 'select', options: ['Favorable', 'Contre-visite'], example: 'Favorable' },
    ],
    success: 'Contrôle d’exemple enregistré pour la démo.',
  },
  {
    id: 'washings', label: 'Lavages', icon: Droplets,
    intro: 'Enregistrez les lavages de vos véhicules.',
    fields: [
      { key: 'vehicle', label: 'Véhicule', type: 'select', options: VEHICLES, example: VEHICLES[0] },
      { key: 'date', label: 'Date', type: 'date', example: '' },
      { key: 'type', label: 'Type', type: 'select', options: ['Intérieur', 'Extérieur', 'Complet'], example: 'Complet' },
    ],
    success: 'Lavage d’exemple enregistré pour la démo.',
  },
]

function seedForm(tuto) {
  const f = {}
  for (const field of tuto.fields) f[field.key] = field.example || ''
  return f
}

export default function SectionTutorials() {
  const [activeIdx, setActiveIdx] = useState(null)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({})

  const tuto = activeIdx != null ? TUTORIALS[activeIdx] : null

  const open = (idx) => {
    setActiveIdx(idx)
    setDone(false)
    setForm(seedForm(TUTORIALS[idx]))
  }
  const close = () => { setActiveIdx(null); setDone(false) }
  const restart = () => { setDone(false); setForm(seedForm(tuto)) }
  const next = () => {
    const n = (activeIdx + 1) % TUTORIALS.length
    open(n)
  }

  return (
    <>
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#0066FF]/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-[#0066FF]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Tutoriels par section</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Entraînez-vous librement. Vos essais ne sont jamais enregistrés.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TUTORIALS.map((tu, idx) => {
            const Icon = tu.icon
            return (
              <button
                key={tu.id}
                onClick={() => open(idx)}
                className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-zinc-200 hover:border-[#0066FF] hover:bg-[#0066FF]/[0.03] text-left transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 group-hover:bg-[#0066FF]/10 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Icon className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#0066FF] transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors">{tu.label}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-300 group-hover:text-[#0066FF] flex-shrink-0 transition-colors">
                  <Play className="w-3 h-3" /> Lancer
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sandboxed tutorial dialog */}
      <Dialog open={activeIdx != null} onOpenChange={o => { if (!o) close() }}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          {tuto && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <tuto.icon className="w-4 h-4 text-[#0066FF]" />
                  Tutoriel — {tuto.label}
                </DialogTitle>
              </DialogHeader>

              {!done ? (
                <div className="space-y-4 mt-1">
                  <p className="text-sm text-zinc-500 leading-relaxed">{tuto.intro}</p>

                  {tuto.fields.length > 0 && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-3">
                      <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Exemple à essayer</p>
                      {tuto.fields.map(field => (
                        <div key={field.key}>
                          <Label>{field.label}</Label>
                          {field.type === 'select' ? (
                            <Select value={form[field.key]} onValueChange={v => setForm(f => ({ ...f, [field.key]: v }))}>
                              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                              <SelectContent>
                                {field.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type={field.type === 'number' ? 'number' : field.type}
                              value={form[field.key]}
                              onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={close} className="flex-shrink-0">Fermer</Button>
                    <Button onClick={() => setDone(true)} className="flex-1 bg-[#0066FF] hover:bg-[#0052D6]">
                      <Check className="w-4 h-4 mr-1.5" />{tuto.submitLabel || 'Valider (démo)'}
                    </Button>
                  </div>
                  <p className="text-[11px] text-zinc-400 text-center">Aucune donnée n’est enregistrée pendant le tutoriel.</p>
                </div>
              ) : (
                <div className="mt-1 text-center py-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 mb-1">Bravo !</p>
                  <p className="text-sm text-zinc-500 mb-1">{tuto.success}</p>
                  <p className="text-[11px] text-zinc-400 mb-5">Ceci était une démonstration : rien n’a été enregistré.</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={restart} className="flex-1">
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Recommencer
                    </Button>
                    <Button onClick={next} className="flex-1 bg-[#0066FF] hover:bg-[#0052D6]">
                      Section suivante <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </div>
                  <button onClick={close} className="mt-3 w-full text-center text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors">
                    Terminer
                  </button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
