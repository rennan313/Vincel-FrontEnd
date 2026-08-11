import { Card } from '@/components/ui/Card'
import { ProjectTimeline } from '@/features/projects/detail/ProjectTimeline'
import { getTotalDays } from '@/features/projects/detail/projectDerivations'
import type { ProjectDraft } from '@/features/projects/create/types'

interface ScheduleTabProps {
  draft: ProjectDraft
}

export function ScheduleTab({ draft }: ScheduleTabProps) {
  return (
    <Card>
      <ProjectTimeline
        phases={draft.planning.phases}
        showSummary
        startDate={draft.schedule.startDate}
        endDate={draft.schedule.endDate}
        totalDays={getTotalDays(draft)}
      />
    </Card>
  )
}
