export type GalleryVariant = 'default' | 'wide' | 'tall'

export interface GalleryItemData {
  name: string
  price: string
  priceArs: string
  img: string
  alt: string
  variant: GalleryVariant
  imgPosition?: string
}

export const GALLERY_ITEMS: GalleryItemData[] = [
  {
    name: 'Trench Oversize',
    price: '120 PLR',
    priceArs: '$45.000 ARS',
    img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
    alt: 'Trench Oversize',
    variant: 'tall',
  },
  {
    name: 'Vestido Midi Floral',
    price: '80 PLR',
    priceArs: '$32.000 ARS',
    img: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80',
    alt: 'Vestido Midi Floral',
    variant: 'default',
  },
  {
    name: 'Blazer Vintage',
    price: '95 PLR',
    priceArs: '$38.000 ARS',
    img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80',
    alt: 'Blazer Vintage',
    variant: 'default',
  },
  {
    name: 'Camisa Seda',
    price: '70 PLR',
    priceArs: '$28.000 ARS',
    img: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&q=80',
    alt: 'Camisa Seda',
    variant: 'default',
  },
  {
    name: 'Conjunto Total Black',
    price: '200 PLR',
    priceArs: '$78.000 ARS',
    img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80',
    alt: 'Conjunto Total Black',
    variant: 'wide',
    imgPosition: 'center 30%',
  },
  {
    name: 'Bolso Cuero',
    price: '110 PLR',
    priceArs: '$44.000 ARS',
    img: 'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=600&q=80',
    alt: 'Bolso Cuero',
    variant: 'default',
  },
]
