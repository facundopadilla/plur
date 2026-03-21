import { cn } from '@/lib/utils'

interface SelectableCardProps {
  selected: boolean
  onToggle: () => void
  children: React.ReactNode
  colorSwatch?: string
  className?: string
}

export function SelectableCard({
  selected,
  onToggle,
  children,
  className,
}: SelectableCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'relative flex flex-col items-center justify-center gap-2 p-4 border cursor-pointer transition-all duration-200 text-left w-full',
        'bg-pl-gray-700 border-pl-gray-500',
        selected
          ? 'border-pl-accent bg-pl-accent/10'
          : 'hover:border-pl-gray-400 hover:bg-pl-gray-600',
        className,
      )}
      style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-pl-accent" />
      )}
      {children}
    </button>
  )
}
