import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { isPlausibleDate, pastBounds } from '@/lib/dateBounds'

// Champ date qui refuse ce qui n'a pas de sens.
//
// `min` et `max` sur un `<input type="date">` ne bloquent rien : le navigateur
// marque le champ invalide, mais la valeur est bien posée et le code la lit.
// C'est ainsi qu'un entretien a été enregistré au 15 janvier 22026, produisant
// une échéance à vingt mille ans.
//
// Ici la valeur hors bornes n'atteint jamais l'état du formulaire : elle est
// refusée à la saisie, et le champ dit pourquoi.
export default function DateInput({ value, onChange, bounds = pastBounds(), className = '', ...rest }) {
  const [refused, setRefused] = useState(null)

  const handle = (e) => {
    const next = e.target.value
    // Un champ vidé est une saisie légitime : on laisse passer.
    if (!next) { setRefused(null); onChange(''); return }
    if (!isPlausibleDate(next, bounds)) {
      const year = next.slice(0, 4)
      setRefused(
        year.length > 4 || Number(year) > Number(bounds.max.slice(0, 4))
          ? "Cette date est dans le futur ou l'année est mal saisie."
          : 'Cette date est trop ancienne.'
      )
      return   // l'état du formulaire garde la dernière valeur correcte
    }
    setRefused(null)
    onChange(next)
  }

  return (
    <>
      <Input
        type="date"
        value={value || ''}
        min={bounds.min}
        max={bounds.max}
        onChange={handle}
        className={(refused ? 'border-amber-300 focus-visible:ring-amber-200 ' : '') + className}
        {...rest}
      />
      {refused && (
        <p className="mt-1 text-xs text-amber-800">
          {refused} Attendu entre {bounds.min.split('-').reverse().join('/')} et{' '}
          {bounds.max.split('-').reverse().join('/')}.
        </p>
      )}
    </>
  )
}
