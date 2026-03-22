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
  avatarDataUrl: string | null
  addReferencePhoto: (photo: Omit<ReferencePhoto, 'id' | 'uploadedAt'>) => void
  removeReferencePhoto: (id: string) => void
  setAvatarDataUrl: (dataUrl: string | null) => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      referencePhotos: [],
      avatarDataUrl: null,
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
      setAvatarDataUrl: (dataUrl) => set({ avatarDataUrl: dataUrl }),
    }),
    { name: 'profile-storage' },
  ),
)
