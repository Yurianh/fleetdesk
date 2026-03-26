import { useAuth } from './AuthContext'

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
  // Collaborators inherit the org owner's plan (enterprise is the only plan with invites)
  const plan = user?.user_metadata?.org_id ? 'enterprise' : (user?.user_metadata?.plan ?? 'starter')
  const limits = LIMITS[plan] ?? LIMITS.starter

  return {
    plan,
    limits,
    canAddVehicle: vehicleCount < limits.vehicles,
    canAddDriver:  driverCount  < limits.drivers,
  }
}
