import { Star } from 'lucide-react'
import type { TestimonialData } from '../data/testimonials'

interface TestimonialCardProps {
  testimonial: TestimonialData
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div
      className="bg-white p-[clamp(28px,3vw,48px)]"
      style={{ border: '1px solid rgba(10,10,10,0.1)' }}
    >
      <div className="flex items-center gap-0.5 mb-5">
        {Array.from({ length: testimonial.stars }, (_, i) => (
          <Star key={i} className="w-4 h-4 fill-pl-accent text-pl-accent" />
        ))}
      </div>
      <p className="text-[14px] font-light leading-[1.7] text-pl-black/70 italic mb-6 font-body">
        "{testimonial.text}"
      </p>
      <div className="flex items-center gap-3">
        <img
          src={testimonial.avatarUrl}
          alt={testimonial.authorName}
          loading="lazy"
          className="w-9 h-9 rounded-full object-cover"
        />
        <div>
          <div className="text-[12px] font-semibold text-pl-black font-body">
            {testimonial.authorName}
          </div>
          <div className="text-[10px] text-pl-black/40 font-body">{testimonial.authorRole}</div>
        </div>
      </div>
    </div>
  )
}
