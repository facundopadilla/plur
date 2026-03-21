/**
 * @temporary — Reemplazar con tipos generados de @/api/generated
 * cuando los endpoints de Django Ninja estén disponibles.
 * Ejecutar: pnpm generate:types
 */

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
}

export interface SignupRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  date_of_birth: string // ISO 8601 — YYYY-MM-DD
  phone_number: string
  profile_picture?: File
}

export interface SignupResponse {
  id: number
  email: string
  message: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetResponse {
  message: string
}

export interface ActivationRequest {
  email: string
  code: string
}

export interface ActivationResponse {
  message: string
}

/** Estado interno del wizard de signup */
export interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  dateOfBirth: string
  phoneNumber: string
  profilePicture: File | null
}
