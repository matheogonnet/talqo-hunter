import Image from 'next/image'
import { cn } from '@/lib/utils'
import { TALQO_FAVICON_URL } from '@/lib/brand'

type TalqoMarkProps = {
  size?: number
  className?: string
}

/** Logo Talqo (favicon officiel). */
export function TalqoMark({ size = 32, className }: TalqoMarkProps) {
  return (
    <Image
      src={TALQO_FAVICON_URL}
      alt="Talqo"
      width={size}
      height={size}
      className={cn('rounded-lg border border-sidebar-border bg-white object-contain', className)}
      unoptimized
    />
  )
}
