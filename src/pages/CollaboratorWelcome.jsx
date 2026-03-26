import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, CheckCircle2, Truck, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'

export default function CollaboratorWelcome() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const orgOwnerName = user?.user_metadata?.org_owner_name || 'votre organisation'
  const role         = user?.user_metadata?.role || 'member'
  const isReInvited  = !!user?.user_metadata?.re_invited

  const [name, setName]         = useState(user?.user_metadata?.full_name || '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleJoin() {
    setError('')
    if (!name.trim()) return setError('Veuillez entrer votre prenom.')
    if (!isReInvited) {
      if (password.length < 8)  return setError('Le mot de passe doit contenir au moins 8 caracteres.')
      if (password !== confirm)  return setError('Les mots de passe ne correspondent pas.')
    }

    setLoading(true)
    try {
      const updateData = {
        full_name: name.trim(),
        onboarding_complete: true,
        re_invited: false,
      }
      const updatePayload = { data: updateData }
      if (!isReInvited) updatePayload.password = password

      const { error: updateErr } = await supabase.auth.updateUser(updatePayload)
      if (updateErr) throw updateErr

      // Activate org membership via edge function (service role — bypasses RLS for all clients)
      const { data: { session } } = await supabase.auth.getSession()
      const { error: joinErr } = await supabase.functions.invoke('join-org', {
        body: { full_name: name.trim() },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (joinErr) throw joinErr

      navigate('/Dashboard', { replace: true })
    } catch (e) {
      setError(e.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #bfdbfe 0%, #d1fae5 45%, #fef3c7 100%)', backgroundAttachment: 'fixed' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-6 select-none pointer-events-none">
        <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-sm">
          <Truck className="w-4 h-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold text-zinc-800 tracking-tight">FleetDesk</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">

        {/* Invitation badge */}
        <div className="flex justify-center mb-5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-3 py-1.5 rounded-full">
            <Users className="w-3.5 h-3.5" />
            Invitation {role === 'admin' ? 'Administrateur' : 'Membre'}
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-[17px] font-semibold text-zinc-900 mb-1 text-center">
          {isReInvited ? 'Bienvenue a nouveau dans' : 'Rejoignez la flotte de'}
        </h1>
        <p className="text-base font-semibold text-[#2563EB] text-center mb-1">{orgOwnerName}</p>
        <p className="text-sm text-zinc-400 text-center mb-6">
          {isReInvited
            ? 'Confirmez votre nom pour rejoindre cette flotte.'
            : "Creez votre acces pour collaborer sur cette flotte."}
        </p>

        {/* Fields */}
        <div className="space-y-4 mb-5">

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Votre prenom</label>
            <input
              type="text"
              placeholder="Ex : Marie"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all duration-150"
            />
          </div>

          {/* Password — only for new users */}
          {!isReInvited && (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="8 caracteres minimum"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 pr-9 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all duration-150"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Confirmer le mot de passe</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Repetez le mot de passe"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all duration-150"
                />
              </div>
            </>
          )}
        </div>

        {/* What you get */}
        <div className="bg-zinc-50 rounded-xl p-3.5 mb-5 space-y-2">
          {[
            'Acces complet a la flotte partagee',
            "Actions tracees dans le journal d'activite",
            isReInvited ? 'Connexion avec votre email habituel' : 'Connexion avec votre email et ce mot de passe',
          ].map(item => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              <span className="text-xs text-zinc-500">{item}</span>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4">{error}</p>
        )}

        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl py-2.5 transition-all duration-150 shadow-sm"
        >
          {loading ? 'En cours...' : isReInvited ? 'Rejoindre' : "Creer mon acces et rejoindre"}
        </button>

        <p className="text-center text-xs text-zinc-400 mt-4">
          Connecte en tant que <span className="font-medium text-zinc-500">{user?.email}</span>
        </p>
      </div>

      <p className="mt-6 text-xs text-zinc-500/70">© 2025 FleetDesk</p>
    </div>
  )
}
