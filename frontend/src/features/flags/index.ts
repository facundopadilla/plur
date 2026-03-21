export const FEATURE_FLAGS = {
  DASHBOARD_IA_V2: import.meta.env.VITE_FLAG_DASHBOARD_IA_V2 === 'true',
  MATCH_CHAT: import.meta.env.VITE_FLAG_MATCH_CHAT === 'true',
  PROXIMITY_SORT: import.meta.env.VITE_FLAG_PROXIMITY_SORT === 'true',
  TRANSAK_ONRAMP: import.meta.env.VITE_FLAG_TRANSAK_ONRAMP === 'true',
} as const
