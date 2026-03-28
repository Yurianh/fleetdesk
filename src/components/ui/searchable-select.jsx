import * as React from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/**
 * SearchableSelect
 *
 * Drop-in replacement for shadcn Select when the list is long.
 * Props:
 *   value        – current value (string)
 *   onValueChange – (value: string) => void
 *   options      – [{ value: string, label: string }]
 *   placeholder  – string shown when nothing selected
 *   className    – extra classes on the trigger button
 */
export function SearchableSelect({ value, onValueChange, options = [], placeholder = 'Sélectionner...', className }) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const inputRef = React.useRef(null)

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  const selected = options.find(o => o.value === value)

  // Focus the search input as soon as the popover opens
  React.useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const handleSelect = (optValue) => {
    onValueChange(optValue === value ? '' : optValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !selected && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        sideOffset={4}
      >
        {/* Search input */}
        <div className="flex items-center border-b border-slate-100 px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher..."
            className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Option list */}
        <div className="max-h-60 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Aucun résultat.</p>
          ) : (
            filtered.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => handleSelect(o.value)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors',
                  value === o.value && 'bg-slate-50 font-medium'
                )}
              >
                <Check className={cn('h-4 w-4 shrink-0 text-blue-600', value === o.value ? 'opacity-100' : 'opacity-0')} />
                <span className="truncate">{o.label}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
