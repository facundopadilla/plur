export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL'

export interface StyleOption {
  id: string
  labelKey: string
  icon: string
}

export interface ColorOption {
  id: string
  labelKey: string
  hex: string
}

export interface OnboardingFormData {
  selectedStyles: string[]
  selectedColors: string[]
  upperBodySize: ClothingSize | null
  lowerBodySize: ClothingSize | null
  shoeSize: string
  heightCm: string
  weightKg: string
}
