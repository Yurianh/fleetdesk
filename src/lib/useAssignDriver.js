import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createAssignment } from './useFleetData'

// Shared assign orchestration for both assignment pickers (VehicleDetail-side
// AssignDriverDialog and DriverDetail's inline vehicle picker). Owns the
// createAssignment call, cache invalidation, and the pending flag; callers keep
// their own success toast because the wording differs by which side is fixed.
// Returns { assign, assigning } where assign resolves to { swapped }.
export function useAssignDriver() {
  const queryClient = useQueryClient()
  const [assigning, setAssigning] = useState(false)

  const assign = async ({ vehicleId, driverId }) => {
    setAssigning(true)
    try {
      const result = await createAssignment({
        vehicle_id: vehicleId,
        driver_id: driverId,
        assigned_at: new Date().toISOString(),
      })
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      return result // { swapped }
    } finally {
      setAssigning(false)
    }
  }

  return { assign, assigning }
}
