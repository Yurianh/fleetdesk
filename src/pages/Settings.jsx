import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, CreditCard, Globe, Shield, ChevronRight, Check, Loader2, Truck, Zap, Sun, Moon, Users, UserPlus, Trash2, Mail } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import { supabase } from '@/lib/supabase'
import { usePlanLimits } from '@/lib/usePlanLimits'
import { useVehicles, useDrivers } from '@/lib/useFleetData'
import { useTranslation } from 'react-i18next'
import { useOrgMembers, useInviteMember, useRemoveMember } from '@/lib/useOrg'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import { usePageTitle } from '@/lib/usePageTitle'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SECTIONS = [
  { id: 'profile',  icon: User,       labelKey: 'settings.profile' },
  { id: 'team',     icon: Users,      labelKey: 'settings.team' },
  { id: 'plan',     icon: CreditCard, labelKey: 'settings.plan' },
  { id: 'language', icon: Globe,      labelKey: 'settings.language' },
  { id: 'account',  icon: Shield,     labelKey: 'settings.account' },
  { id: 'appearance', icon: Sun,      labelKey: 'settings.appearance' },
]

const PLAN_INFO = {
  starter:    { label: 'Starter',    color: 'bg-zinc-100 text-zinc-700',    vehicles: 5,         drivers: 3         },
  pro:        { label: 'Pro',        color: 'bg-blue-50 text-blue-700',     vehicles: 25,        drivers: '∞'       },
  enterprise: { label: 'Enterprise', color: 'bg-violet-50 text-violet-700', vehicles: '∞',       drivers: '∞'       },
}

export default function Settings() {
  usePageTitle('Paramètres')
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: vehicles } = useVehicles()
  const { data: drivers } = useDrivers()
  const { plan, limits } = usePlanLimits(vehicles.length, drivers.length)

  // Team
  const { data: members = [] } = useOrgMembers()
  const inviteMember = useInviteMember()
  const removeMember = useRemoveMember()
  const isCollaborator = !!user?.user_metadata?.org_id
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')

  const [section, setSection] = useState('profile')
  const { isDark, toggleTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [name,    setName]    = useState(user?.user_metadata?.full_name || '')
  const [company, setCompany] = useState(user?.user_metadata?.company   || '')

  async function saveProfile() {
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim(), company: company.trim() } })
      if (error) throw error
      toast.success(t('settings.profileSaved'))
    } catch (e) {
      toast.error(e.message)
    } finally { setSaving(false) }
  }

  async function handleUpgrade(targetPlan) {
    setSaving(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { plan: targetPlan, return_url: `${window.location.origin}/billing/success` },
      })
      if (error) throw error
      window.location.href = data.url
    } catch (e) {
      toast.error(e.message)
    } finally { setSaving(false) }
  }

  async function handleDeleteAccount() {
    setSaving(true)
    try {
      const { error } = await supabase.functions.invoke('delete-account')
      if (error) throw error
      await supabase.auth.signOut()
      navigate('/', { replace: true })
    } catch (e) {
      toast.error(e.message)
      setSaving(false)
      setConfirmDelete(false)
    }
  }

  const planInfo = PLAN_INFO[plan] ?? PLAN_INFO.starter

  return (
    <div className="p-5 sm:p-8">
      <PageHeader title={t('settings.title')} description={t('settings.desc')} />

      <div className="flex gap-6 mt-6">
        {/* Left nav */}
        <div className="w-48 flex-shrink-0 hidden sm:block">
          <nav className="space-y-0.5">
            {SECTIONS.map(s => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                    section === s.id
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${section === s.id ? 'text-[#2563EB]' : 'text-zinc-400'}`} />
                  {t(s.labelKey)}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Mobile section selector */}
        <div className="sm:hidden w-full mb-4">
          <div className="flex gap-1 bg-zinc-100 rounded-xl p-1 overflow-x-auto">
            {SECTIONS.map(s => {
              const Icon = s.icon
              return (
                <button key={s.id} onClick={() => setSection(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    section === s.id ? 'bg-slate-900 text-white' : 'text-zinc-500'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />{t(s.labelKey)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ── Profile ── */}
          {section === 'profile' && (
            <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
              <div className="p-5">
                <h2 className="text-sm font-semibold text-zinc-900 mb-4">{t('settings.profileInfo')}</h2>
                <div className="space-y-4 max-w-sm">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">{t('settings.fullName')}</label>
                    <input value={name} onChange={e => setName(e.target.value)}
                      className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30" />
                  </div>
                  {isCollaborator ? (
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">Organisation</label>
                      <input value={user?.user_metadata?.org_company || ''} disabled
                        className="w-full border border-zinc-100 rounded-lg px-3 py-2 text-sm text-zinc-400 bg-zinc-50 cursor-not-allowed" />
                      <p className="text-[11px] text-zinc-400 mt-1">Géré par le propriétaire de l'organisation.</p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">{t('settings.company')}</label>
                      <input value={company} onChange={e => setCompany(e.target.value)}
                        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">{t('settings.email')}</label>
                    <input value={user?.email || ''} disabled
                      className="w-full border border-zinc-100 rounded-lg px-3 py-2 text-sm text-zinc-400 bg-zinc-50 cursor-not-allowed" />
                    <p className="text-[11px] text-zinc-400 mt-1">{t('settings.emailReadOnly')}</p>
                  </div>
                  <button onClick={saveProfile} disabled={saving}
                    className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {t('settings.saveChanges')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Plan ── */}
          {section === 'plan' && (
            <div className="space-y-4">
              {/* Current plan */}
              <div className="bg-white border border-zinc-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-zinc-900 mb-4">{t('settings.currentPlan')}</h2>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${planInfo.color}`}>{planInfo.label}</span>
                    <span className="text-sm text-zinc-500">{t('settings.activePlan')}</span>
                  </div>
                  {!isCollaborator && (plan !== 'starter' || user?.user_metadata?.stripe_customer_id) && (
                    <button
                      onClick={async () => {
                        setSaving(true)
                        try {
                          const { data: { session } } = await supabase.auth.getSession()
                          const { data, error } = await supabase.functions.invoke('create-portal-session', {
                            headers: { Authorization: `Bearer ${session?.access_token}` },
                            body: { return_url: window.location.origin + '/Settings' },
                          })
                          if (error) throw error
                          window.location.href = data.url
                        } catch (e) { toast.error(e.message) }
                        finally { setSaving(false) }
                      }}
                      disabled={saving}
                      className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 border border-zinc-200 hover:border-zinc-300 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                      Gérer l'abonnement
                    </button>
                  )}
                </div>
                {isCollaborator && (
                  <p className="text-xs text-zinc-400 mb-4">
                    Plan géré par <span className="font-medium text-zinc-600">{user?.user_metadata?.org_owner_name || "l'organisation"}</span>.
                  </p>
                )}
                {/* Usage */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-50 rounded-lg p-3">
                    <p className="text-xs text-zinc-400 mb-1">{t('nav.vehicles')}</p>
                    <p className="text-lg font-bold text-zinc-900 font-mono">
                      {vehicles.length}<span className="text-sm font-normal text-zinc-400"> / {limits.vehicles === Infinity ? '∞' : limits.vehicles}</span>
                    </p>
                    {limits.vehicles !== Infinity && (
                      <div className="mt-2 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2563EB] rounded-full transition-all"
                          style={{ width: `${Math.min(100, (vehicles.length / limits.vehicles) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-3">
                    <p className="text-xs text-zinc-400 mb-1">{t('nav.drivers')}</p>
                    <p className="text-lg font-bold text-zinc-900 font-mono">
                      {drivers.length}<span className="text-sm font-normal text-zinc-400"> / {limits.drivers === Infinity ? '∞' : limits.drivers}</span>
                    </p>
                    {limits.drivers !== Infinity && (
                      <div className="mt-2 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2563EB] rounded-full transition-all"
                          style={{ width: `${Math.min(100, (drivers.length / limits.drivers) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Billing portal — subscribed non-collaborator */}
              {!isCollaborator && plan !== 'starter' && (
                <div className="bg-white border border-zinc-200 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-zinc-900 mb-1">Facturation & paiement</h2>
                  <p className="text-xs text-zinc-400 mb-4">Gérez votre moyen de paiement, consultez vos factures ou annulez votre abonnement.</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Mettre à jour le moyen de paiement', desc: 'Changer votre carte bancaire ou IBAN' },
                      { label: "Télécharger les factures", desc: "Accédez à l'historique de vos paiements" },
                      { label: 'Annuler ou changer de formule', desc: 'Résiliez ou passez à un autre plan' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0">
                        <div>
                          <p className="text-sm text-zinc-700 font-medium">{item.label}</p>
                          <p className="text-xs text-zinc-400">{item.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-300 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={async () => {
                      setSaving(true)
                      try {
                        const { data: { session } } = await supabase.auth.getSession()
                        const { data, error } = await supabase.functions.invoke('create-portal-session', {
                          headers: { Authorization: `Bearer ${session?.access_token}` },
                          body: { return_url: window.location.origin + '/Settings' },
                        })
                        if (error) throw error
                        window.location.href = data.url
                      } catch (e) { toast.error(e.message) }
                      finally { setSaving(false) }
                    }}
                    disabled={saving}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] disabled:opacity-50 text-white text-sm font-semibold rounded-xl py-2.5 transition-all duration-150 shadow-sm"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Ouvrir le portail de facturation
                  </button>
                </div>
              )}

              {/* Upgrade options */}
              {plan !== 'enterprise' && !isCollaborator && (
                <div className="bg-white border border-zinc-200 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-zinc-900 mb-4">{t('settings.upgradePlan')}</h2>
                  <div className="space-y-3">
                    {plan === 'starter' && (
                      <div className="flex items-center justify-between p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Zap className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-zinc-900">Pro</p>
                            <p className="text-xs text-zinc-500">25 {t('nav.vehicles').toLowerCase()} · {t('settings.unlimitedDrivers')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-zinc-900">29 €<span className="text-xs font-normal text-zinc-400">/mois</span></span>
                          <button onClick={() => handleUpgrade('pro')} disabled={saving}
                            className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors">
                            {t('settings.upgrade')} <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-4 border border-violet-100 bg-violet-50/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                          <Truck className="w-4 h-4 text-violet-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">Enterprise</p>
                          <p className="text-xs text-zinc-500">{t('settings.unlimitedAll')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-zinc-900">79 €<span className="text-xs font-normal text-zinc-400">/mois</span></span>
                        <button onClick={() => handleUpgrade('enterprise')} disabled={saving}
                          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors">
                          {t('settings.upgrade')} <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* ── Team ── */}
          {section === 'team' && (
            <div className="space-y-4">
              {plan !== 'enterprise' && !isCollaborator ? (
                <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
                  <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-violet-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900 mb-2">Collaboration — Formule Enterprise</h3>
                  <p className="text-xs text-zinc-500 mb-5 max-w-xs mx-auto">Invitez votre équipe, gérez les rôles et suivez toutes les actions dans un journal d'activité partagé.</p>
                  <button onClick={() => handleUpgrade('enterprise')} disabled={saving}
                    className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg px-4 py-2 transition-colors">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Passer à Enterprise <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : isCollaborator ? (
                <div className="bg-white border border-zinc-200 rounded-xl p-5">
                  <p className="text-sm text-zinc-500">Vous êtes membre d'une organisation. Seul le propriétaire peut gérer l'équipe.</p>
                </div>
              ) : (
                <>
                  {/* Invite form */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-[#2563EB]" /> Inviter un collaborateur
                    </h2>
                    <div className="flex gap-2 max-w-md">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          placeholder="adresse@email.com"
                          className="w-full pl-8 pr-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                        />
                      </div>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger className="w-[110px] border-zinc-200 text-sm text-zinc-700 rounded-lg h-[38px] focus:ring-[#2563EB]/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Membre</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <button
                        onClick={async () => {
                          if (!inviteEmail) return
                          try {
                            await inviteMember.mutateAsync({ email: inviteEmail, role: inviteRole })
                            toast.success('Invitation envoyée.')
                            setInviteEmail('')
                          } catch (e) { toast.error(e.message) }
                        }}
                        disabled={inviteMember.isPending || !inviteEmail}
                        className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors h-[38px]"
                      >
                        {inviteMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        Inviter
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-2">L'invité recevra un email pour rejoindre votre organisation.</p>
                  </div>

                  {/* Members list */}
                  <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
                    <div className="px-5 py-3">
                      <h2 className="text-sm font-semibold text-zinc-900">Membres ({members.length})</h2>
                    </div>
                    {members.length === 0 && (
                      <div className="px-5 py-8 text-center text-sm text-zinc-400">
                        Aucun collaborateur pour le moment.
                      </div>
                    )}
                    {members.map(m => (
                      <div key={m.id} className="flex items-center justify-between px-5 py-3 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-semibold text-zinc-600 flex-shrink-0">
                            {m.email[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-800 truncate">{m.email}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                m.role === 'admin' ? 'bg-violet-50 text-violet-600' : 'bg-zinc-100 text-zinc-500'
                              }`}>
                                {m.role === 'admin' ? 'Admin' : 'Membre'}
                              </span>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                m.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {m.status === 'active' ? 'Actif' : 'En attente'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await removeMember.mutateAsync({ memberId: m.id, userId: m.user_id })
                              toast.success('Membre retiré.')
                            } catch (e) { toast.error(e.message) }
                          }}
                          disabled={removeMember.isPending}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          title="Retirer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Language ── */}
          {section === 'language' && (
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-4">{t('settings.languageTitle')}</h2>
              <div className="flex gap-3">
                {[{ code: 'fr', label: 'Français', flag: '🇫🇷' }, { code: 'en', label: 'English', flag: '🇬🇧' }].map(lang => (
                  <button key={lang.code} onClick={() => i18n.changeLanguage(lang.code)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      i18n.language === lang.code
                        ? 'border-[#2563EB] bg-blue-50 text-blue-700'
                        : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                    }`}>
                    <span className="text-lg">{lang.flag}</span>
                    {lang.label}
                    {i18n.language === lang.code && <Check className="w-4 h-4 ml-1" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Appearance ── */}
          {section === 'appearance' && (
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-4">{t('settings.appearanceTitle')}</h2>
              <div className="flex gap-3">
                {[
                  { id: false, icon: Sun,  label: t('settings.lightMode') },
                  { id: true,  icon: Moon, label: t('settings.darkMode')  },
                ].map(opt => {
                  const Icon = opt.icon
                  return (
                    <button key={String(opt.id)} onClick={() => opt.id !== isDark && toggleTheme()}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        isDark === opt.id
                          ? 'border-[#2563EB] bg-blue-50 text-blue-700'
                          : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                      }`}>
                      <Icon className="w-4 h-4" />
                      {opt.label}
                      {isDark === opt.id && <Check className="w-4 h-4 ml-1" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Account ── */}
          {section === 'account' && (
            <div className="space-y-4">
              <div className="bg-white border border-zinc-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-zinc-900 mb-1">{t('settings.accountInfo')}</h2>
                <p className="text-xs text-zinc-400 mb-4">{user?.email}</p>
                <div className="text-xs text-zinc-500 space-y-1">
                  <p>{t('settings.memberSince')} {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                  <p>{t('settings.authProvider')}: {user?.app_metadata?.provider || 'email'}</p>
                </div>
              </div>
              <div className="bg-white border border-red-100 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-red-600 mb-1">{t('settings.dangerZone')}</h2>
                <p className="text-xs text-zinc-500 mb-4">{t('settings.dangerDesc')}</p>
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)}
                    className="text-xs font-medium text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg px-3 py-2 transition-colors">
                    {t('settings.deleteAccount')}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600">{t('settings.confirmDelete')}</span>
                    <button onClick={() => setConfirmDelete(false)}
                      className="text-xs font-medium text-zinc-500 border border-zinc-200 rounded-lg px-3 py-1.5 hover:bg-zinc-50 transition-colors">
                      {t('common.cancel')}
                    </button>
                    <button onClick={handleDeleteAccount} disabled={saving} className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      {t('settings.confirmDeleteBtn')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
