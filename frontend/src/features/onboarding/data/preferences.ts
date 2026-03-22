export interface PreferenceOption {
  id: string
  labelKey: string
}

export const CONDITION_OPTIONS: PreferenceOption[] = [
  { id: 'new', labelKey: 'dashboard.filters.conditions.new' },
  { id: 'excellent', labelKey: 'dashboard.filters.conditions.excellent' },
  { id: 'good', labelKey: 'dashboard.filters.conditions.good' },
  { id: 'fair', labelKey: 'dashboard.filters.conditions.fair' },
]

export const GENDER_OPTIONS: PreferenceOption[] = [
  { id: 'mujer', labelKey: 'dashboard.preferences.gender.mujer' },
  { id: 'hombre', labelKey: 'dashboard.preferences.gender.hombre' },
  { id: 'unisex', labelKey: 'dashboard.preferences.gender.unisex' },
]
