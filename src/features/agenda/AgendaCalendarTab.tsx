import { forwardRef, useImperativeHandle, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ApiError } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import type { AssignableUser } from '@/features/users/usersApi'
import type { ProjectTimelineBar } from '@/features/agenda/agendaDerivations'
import { todayISO } from '@/features/agenda/timelineMath'
import { monthStartISO } from '@/features/agenda/calendarMath'
import { deleteAgendaTask, type AgendaTask } from '@/features/agenda/agendaTasksApi'
import { AgendaSidebar } from '@/features/agenda/AgendaSidebar'
import { CalendarView, type AgendaFilterKind } from '@/features/agenda/CalendarView'
import { AgendaTaskModal } from '@/features/agenda/AgendaTaskModal'
import { AgendaItemDetailsModal } from '@/features/agenda/AgendaItemDetailsModal'

export interface AgendaCalendarTabHandle {
  openNewAppointment: () => void
}

interface AgendaCalendarTabProps {
  bars: ProjectTimelineBar[]
  assignableUsers: AssignableUser[]
}

export const AgendaCalendarTab = forwardRef<AgendaCalendarTabHandle, AgendaCalendarTabProps>(
  function AgendaCalendarTab({ bars, assignableUsers }, ref) {
    const queryClient = useQueryClient()
    const currentUserId = useAuthStore((state) => state.user?.id)

    const [monthAnchor, setMonthAnchor] = useState(() => monthStartISO(todayISO()))
    const [filterKind, setFilterKind] = useState<AgendaFilterKind>('all')
    const [myItemsOnly, setMyItemsOnly] = useState(false)
    const [taskModal, setTaskModal] = useState<{ date: string | null; kind: 'appointment' | 'task' } | undefined>(
      undefined,
    )
    const [taskToDelete, setTaskToDelete] = useState<AgendaTask | null>(null)
    const [viewingTask, setViewingTask] = useState<AgendaTask | null>(null)

    useImperativeHandle(ref, () => ({
      openNewAppointment: () => setTaskModal({ date: null, kind: 'appointment' }),
    }))

    const deleteMutation = useMutation({
      mutationFn: deleteAgendaTask,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['agenda-tasks'] })
        toast.success('Item removido.')
        setTaskToDelete(null)
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : 'Não foi possível remover.')
      },
    })

    return (
      <div className="mt-4 flex flex-col gap-6 lg:flex-row">
        <AgendaSidebar
          monthAnchor={monthAnchor}
          onMonthChange={setMonthAnchor}
          filterKind={filterKind}
          onFilterKindChange={setFilterKind}
          myItemsOnly={myItemsOnly}
          onMyItemsOnlyChange={setMyItemsOnly}
          assignableUsers={assignableUsers}
          onTaskClick={setViewingTask}
        />
        <div className="min-w-0 flex-1">
          <CalendarView
            bars={bars}
            monthAnchor={monthAnchor}
            filterKind={filterKind}
            myItemsOnly={myItemsOnly}
            currentUserId={currentUserId}
            assignableUsers={assignableUsers}
            onDayClick={(date) => setTaskModal({ date, kind: 'task' })}
            onTaskClick={setViewingTask}
          />
        </div>

        <AgendaTaskModal
          open={taskModal !== undefined}
          onClose={() => setTaskModal(undefined)}
          initialDate={taskModal?.date}
          defaultKind={taskModal?.kind}
          assignableUsers={assignableUsers}
        />

        <AgendaItemDetailsModal
          task={viewingTask}
          onClose={() => setViewingTask(null)}
          onDelete={(task) => {
            setViewingTask(null)
            setTaskToDelete(task)
          }}
          assignableUsers={assignableUsers}
        />

        <ConfirmDialog
          open={taskToDelete !== null}
          title="Remover item"
          message={taskToDelete ? `Remover "${taskToDelete.name}" da Agenda?` : ''}
          onConfirm={() => taskToDelete && deleteMutation.mutate(taskToDelete.id)}
          onCancel={() => setTaskToDelete(null)}
        />
      </div>
    )
  },
)
