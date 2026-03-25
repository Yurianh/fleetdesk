import { useEffect } from 'react'

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | FleetDesk` : 'FleetDesk'
    return () => { document.title = 'FleetDesk' }
  }, [title])
}
