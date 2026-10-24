import { createContext } from 'react'
import type {
  UserResponse,
  SettingsResponse,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UpdateSettingsRequest,
} from '../../types/api'

export interface AuthContextValue {
  user: UserResponse | null
  settings: SettingsResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: UpdateProfileRequest) => Promise<UserResponse>
  uploadAvatar: (file: File) => Promise<UserResponse>
  removeAvatar: () => Promise<UserResponse>
  updateSettings: (data: UpdateSettingsRequest) => Promise<SettingsResponse>
  serverError?: string | null
  retryAuth?: () => Promise<void>
  refreshUser: () => Promise<void>
  refreshSettings: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
