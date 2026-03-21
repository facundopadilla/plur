export interface TestimonialData {
  stars: number
  text: string
  authorName: string
  authorRole: string
  avatarUrl: string
}

export const TESTIMONIALS: TestimonialData[] = [
  {
    stars: 5,
    text: 'Vendí ropa que no usaba hace meses y con esos tokens me armé un guardarropa nuevo. Es adictivo.',
    authorName: 'Valentina R.',
    authorRole: '240 intercambios',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
  },
  {
    stars: 5,
    text: 'El probador con IA es un game changer. Ya no compro nada sin probármelo virtualmente.',
    authorName: 'Tomás L.',
    authorRole: '89 matches',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
  },
  {
    stars: 5,
    text: 'Me encanta la idea de que mi ropa tenga una segunda vida. Y el sistema de swipe es super divertido.',
    authorName: 'Camila S.',
    authorRole: '156 intercambios',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
  },
]
