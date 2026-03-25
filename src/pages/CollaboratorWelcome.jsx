import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, CheckCircle2, Truck, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'

const GRADIENT = 'linear-gradient(135deg, #bfdbfe 0%, #d1fae5 45%, #fef3c7 100%)'

export default function CollaboratorWelcome() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const orgOwnerName = user?.user_metadata?.org_owner_name || 'votre organisation'
  const role         = user?.user_metadata?.role || 'member'

  const [name, setName]             = useState('')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  async function handleJoin() {
    setError('')
    if (!name.trim())                       return setError('Veuillez entrer votre prénom.')
    if (password.length < 8)                return setError('Le mot de passe doit contenir au moins 8 caractères.')
    if (password !== confirm)               return setError('Les mots de passe ne correspondent pas.')

    setLoading(true)
    try {
      // Set password + name + mark onboarding complete in one call
      const { error: updateErr } = await supabase.auth.updateUser({
        password,
        data: { full_name: name.trim(), onboarding_complete: true },
      })
      if (updateErr) throw updateErr

      // Activate org_members record
      await supabase
        .from('org_members')
        .update({ status: 'active', joined_at: new Date().toISOString() })
        .eq('email', user.email)
        .eq('status', 'pending')

      navigate('/Dashboard', { replace: true })
    } catch (e) {
      setError(e.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: GRADIENT }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        <div className="h-1 bg-gradient-to-r from-[#2563EB] to-[#7C3AED]" />

        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-zinc-900 tracking-tight">FleetDesk</span>
          </div>

          {/* Invitation badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] bg-[#7C3AED]/8 px-3 py-1.5 rounded-full">
              <Users className="w-3.5 h-3.5" />
              Invitation {role === 'admin' ? 'Administrateur' : 'Membre'}
            </span>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">
              Rejoignez la flotte de
            </h1>
            <p className="text-xl font-semibold text-[#2563EB] mb-3">{orgOwnerName}</p>
            <p className="text-sm text-zinc-500">
              Créez votre accès pour collaborer sur cette flotte.
            </p>
          </div>

          {/* Fields */}
          <div className="space-y-4 mb-6">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Votre prénom
              </label>
              <input
                type="text"
                placeholder="Ex : Marie"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="8 caractères minimum"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 pr-11 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Confirmer le mot de passe
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Répétez le mot de passe"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              />
            </div>
          </div>

          {/* What you get */}
          <div className="bg-zinc-50 rounded-xl p-4 mb-6 space-y-2">
            {[
              'Accès complet à la flotte partagée',
              'Actions tracées dans le journal d\'activité',
              'Connexion avec votre email et ce mot de passe',
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
                <span className="text-sm text-zinc-600">{item}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? 'Création en cours...' : 'Créer mon accès et rejoindre'}
          </button>

          <p className="text-center text-xs text-zinc-400 mt-4">
            Connecté en tant que <span className="font-medium text-zinc-500">{user?.email}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
