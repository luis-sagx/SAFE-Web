import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const STORAGE_KEY = 'mic-training-profile'

const ParticipantContext = createContext(undefined)

function readProfile() {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function initialsFromName(name) {
  if (!name) {
    return 'TU'
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')

  return initials || 'TU'
}

export function roleLabel(profile) {
  return profile?.roleName ? profile.roleName : 'Rol libre de practica'
}

export function ParticipantProvider({ children }) {
  const [profile, setProfile] = useState(() => readProfile())

  const saveProfile = useCallback((nextProfile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile))
    setProfile(nextProfile)
  }, [])

  const clearProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({
      profile,
      saveProfile,
      clearProfile,
      roleLabel: roleLabel(profile),
      initials: initialsFromName(profile?.displayName),
    }),
    [profile, saveProfile, clearProfile],
  )

  return <ParticipantContext.Provider value={value}>{children}</ParticipantContext.Provider>
}

export function useParticipant() {
  const context = useContext(ParticipantContext)

  if (context === undefined) {
    throw new Error('useParticipant debe usarse dentro de <ParticipantProvider>')
  }

  return context
}
