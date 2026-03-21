import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ReferencePhoto {
  id: string
  dataUrl: string
  label: string
  uploadedAt: number
}

interface ProfileState {
  referencePhotos: ReferencePhoto[]
  addReferencePhoto: (photo: Omit<ReferencePhoto, 'id' | 'uploadedAt'>) => void
  removeReferencePhoto: (id: string) => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      referencePhotos: [],
      addReferencePhoto: (photo) =>
        set((state) => ({
          referencePhotos: [
            ...state.referencePhotos,
            { ...photo, id: `photo-${Date.now()}`, uploadedAt: Date.now() },
          ],
        })),
      removeReferencePhoto: (id) =>
        set((state) => ({
          referencePhotos: state.referencePhotos.filter((p) => p.id !== id),
        })),
    }),
    { name: 'profile-storage' },
  ),
)
