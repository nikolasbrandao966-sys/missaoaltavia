import { cn } from '@/lib/utils'

type SectionHeadingProps = {
  eyebrow: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'mb-10 flex flex-col gap-3',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className
      )}
    >
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
        <span className="h-0.5 w-6 rounded-full bg-amber-500" aria-hidden="true" />
        {eyebrow}
        <span className="h-0.5 w-6 rounded-full bg-amber-500" aria-hidden="true" />
      </span>
      <h2 className="max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}
