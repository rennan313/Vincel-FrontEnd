import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { AssignableUser } from '@/features/users/usersApi'
import {
  formatTaskDate,
  formatTime,
  isAppointment,
  NEUTRAL_ASSIGNEE_COLOR,
  type AgendaTask,
} from '@/features/agenda/agendaTasksApi'

interface AgendaItemDetailsModalProps {
  /** The item being viewed — null closes the modal. */
  task: AgendaTask | null
  onClose: () => void
  /** Hands the task back up for the caller's own delete-confirmation flow
   * (see [[feedback-confirm-before-delete]] — this modal never deletes
   * directly, it only requests it). */
  onDelete: (task: AgendaTask) => void
  assignableUsers: AssignableUser[]
}

/** Read-only "what is this" view for a compromisso/tarefa already on the
 * calendar — opened by clicking it, instead of jumping straight to a
 * delete confirmation. Its only action is Excluir. */
export function AgendaItemDetailsModal({ task, onClose, onDelete, assignableUsers }: AgendaItemDetailsModalProps) {
  const assignee = task?.assigneeUserId ? assignableUsers.find((user) => user.id === task.assigneeUserId) : undefined

  return (
    <Modal
      open={task !== null}
      onClose={onClose}
      title={task ? (isAppointment(task) ? 'Compromisso' : 'Tarefa') : ''}
      footer={
        task && (
          <>
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button type="button" variant="danger" icon="Trash2" onClick={() => onDelete(task)}>
              Excluir
            </Button>
          </>
        )
      }
    >
      {task && (
        <div className="space-y-4">
          <p className="text-base font-medium text-(--th-text)">{task.name}</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-(--th-text-muted)">Data</p>
              <p className="text-sm text-(--th-text)">{formatTaskDate(task)}</p>
            </div>
            {isAppointment(task) && (
              <div>
                <p className="text-xs text-(--th-text-muted)">Horário</p>
                <p className="text-sm text-(--th-text)">
                  {formatTime(task.date)} - {formatTime(task.endDate!)}
                </p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-(--th-text-muted)">Responsável</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: assignee?.color ?? NEUTRAL_ASSIGNEE_COLOR }}
              />
              <span className="text-sm text-(--th-text)">{assignee?.name ?? 'Sem responsável'}</span>
            </div>
          </div>

          {task.details && (
            <div>
              <p className="text-xs text-(--th-text-muted)">Detalhes</p>
              <p className="mt-1 text-sm whitespace-pre-wrap text-(--th-text)">{task.details}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
