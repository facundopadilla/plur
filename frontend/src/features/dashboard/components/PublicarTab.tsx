import { useState } from 'react'
import { PublishedListingsView } from './PublishedListingsView'
import { PublishGarmentForm } from './PublishGarmentForm'
import { PublishedGarmentDetail } from './PublishedGarmentDetail'
import type { GarmentOut } from '@/api/generated/types.gen'

type View = 'list' | 'form' | 'detail'

export function PublicarTab() {
  const [view, setView] = useState<View>('form')
  const [selectedGarment, setSelectedGarment] = useState<GarmentOut | null>(null)

  if (view === 'form') {
    return (
      <PublishGarmentForm
        onBack={() => setView('list')}
        onPublish={() => setView('list')}
      />
    )
  }

  if (view === 'detail' && selectedGarment !== null) {
    return (
      <PublishedGarmentDetail
        garment={selectedGarment}
        onBack={() => {
          setSelectedGarment(null)
          setView('list')
        }}
      />
    )
  }

  return (
    <PublishedListingsView
      onAdd={() => setView('form')}
      onGarmentClick={(garment) => {
        setSelectedGarment(garment)
        setView('detail')
      }}
    />
  )
}
