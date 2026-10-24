import React, { useEffect, useState, useCallback } from 'react'
import { apiClient, ApiError } from '../../lib/api-client'
import { useTheme } from '../../hooks/useTheme'
import { AuthContext } from './AuthContext'
import type {
  UserResponse,
  SettingsResponse,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UpdateSettingsRequest,
} from '../../types/api'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [settings, setSettings] = useState<SettingsResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [serverError, setServerError] = useState<string | null>(null)
  const { syncBackendTheme } = useTheme()

  const refreshSettings = useCallback(async () => {
    try {
      const data = await apiClient.get<SettingsResponse>('/settings')
      setSettings(data)
      if (data.theme) {
        syncBackendTheme(data.theme)
      }
    } catch {
      // Non-fatal if settings fetch fails
    }
  }, [syncBackendTheme])

  const refreshUser = useCallback(async () => {
    try {
      setServerError(null)
      const userData = await apiClient.get<UserResponse>('/auth/me')
      setUser(userData)
      await refreshSettings()
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null)
        setSettings(null)
      } else {
        setServerError('Server is temporarily unreachable or waking up from inactivity.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [refreshSettings])

  const retryAuth = useCallback(async () => {
    setIsLoading(true)
    setServerError(null)
    await refreshUser()
  }, [refreshUser])

  // Bootstrap check on application load
  useEffect(() => {
    let isMounted = true

    const bootstrap = async () => {
      try {
        setServerError(null)
        const userData = await apiClient.get<UserResponse>('/auth/me')
        if (!isMounted) return
        setUser(userData)
        try {
          const settingsData = await apiClient.get<SettingsResponse>('/settings')
          if (!isMounted) return
          setSettings(settingsData)
          if (settingsData.theme) {
            syncBackendTheme(settingsData.theme)
          }
        } catch {
          // Non-fatal
        }
      } catch (err: unknown) {
        if (!isMounted) return
        if (err instanceof ApiError && err.status === 401) {
          setUser(null)
          setSettings(null)
        } else {
          // Server error or wake-up timeout: keep track so route guards don't falsely 404
          setServerError('Server is temporarily unreachable or waking up from inactivity.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      isMounted = false
    }
  }, [syncBackendTheme])

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const loggedUser = await apiClient.post<UserResponse>('/auth/login', credentials)
      setUser(loggedUser)
      await refreshSettings()
    },
    [refreshSettings]
  )

  const register = useCallback(
    async (regData: RegisterRequest) => {
      // Backend establishes session cookie on registration
      const newUser = await apiClient.post<UserResponse>('/auth/register', regData)
      setUser(newUser)
      await refreshSettings()
    },
    [refreshSettings]
  )

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Proceed with client logout even if backend failed
    } finally {
      setUser(null)
      setSettings(null)
    }
  }, [])

  const updateProfile = useCallback(async (data: UpdateProfileRequest): Promise<UserResponse> => {
    const updated = await apiClient.patch<UserResponse>('/users/me', data)
    setUser(updated)
    return updated
  }, [])

  const uploadAvatar = useCallback(async (file: File): Promise<UserResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    const updated = await apiClient.postForm<UserResponse>('/users/me/avatar', formData)
    setUser(updated)
    return updated
  }, [])

  const removeAvatar = useCallback(async (): Promise<UserResponse> => {
    const updated = await apiClient.delete<UserResponse>('/users/me/avatar')
    setUser(updated)
    return updated
  }, [])

  const updateSettings = useCallback(
    async (data: UpdateSettingsRequest): Promise<SettingsResponse> => {
      const updated = await apiClient.patch<SettingsResponse>('/settings', data)
      setSettings(updated)
      if (updated.theme) {
        syncBackendTheme(updated.theme)
      }
      return updated
    },
    [syncBackendTheme]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        settings,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        uploadAvatar,
        removeAvatar,
        updateSettings,
        serverError,
        retryAuth,
        refreshUser,
        refreshSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
