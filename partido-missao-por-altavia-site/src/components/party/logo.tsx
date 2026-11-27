import Image from 'next/image'
import { cn } from '@/lib/utils'

export function PartyLogo({
  className,
  priority,
}: {
  className?: string
  priority?: boolean
}) {
  return (
    <Image
      src="/logo-pma.png"
      alt="Logo do Partido Missão por Altávia"
      width={512}
      height={512}
      priority={priority}
      className={cn('object-contain', className)}
    />
  )
}
