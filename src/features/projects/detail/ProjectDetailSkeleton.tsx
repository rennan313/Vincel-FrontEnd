import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

/**
 * Mirrors the real page's section shapes (header, 4 stat cards, tabs bar,
 * the two-card + timeline layout of the default "Visão geral" tab) instead
 * of one generic placeholder block, so the loading state doesn't visually
 * jump when the real content arrives.
 */
export function ProjectDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <Skeleton className="h-4 w-40" />
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-4">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="mt-3 h-6 w-16" />
          </Card>
        ))}
      </div>

      <div className="mt-6 flex gap-4 border-b border-(--th-border) pb-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-20" />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <Skeleton className="h-3.5 w-40" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((__, row) => (
                <div key={row} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <Skeleton className="h-3.5 w-32" />
        <div className="mt-4 space-y-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
