import { useAuth } from './AuthContext'
import { resolvePlan } from './capabilities'

const LIMITS = {
  starter:    { vehicles: 5,        drivers: 3        },
  pro:        { vehicles: 25,       drivers: Infinity  },
  enterprise: { vehicles: Infinity, drivers: Infinity  },
}

/**
 * Returns the current plan limits and usage counts.
 * vehicleCount / driverCount must be passed in (already fetched by the caller).
 */
export function usePlanLimits(vehicleCount = 0, driverCount = 0) {
  const { user } = useAuth()
  // Single source of truth: the trusted plan (app_metadata), collaborators = enterprise.
  const plan = resolvePlan(user)
  const limits = LIMITS[plan] ?? LIMITS.starter

  return {
    plan,
    limits,
    canAddVehicle: vehicleCount < limits.vehicles,
    canAddDriver:  driverCount  < limits.drivers,
  }
}
