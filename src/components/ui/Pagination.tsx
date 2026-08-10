import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  disabled,
}: PaginationProps) {
  const { t } = useTranslation()
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const canPrev = page > 1 && !disabled
  const canNext = page < pageCount && !disabled

  return (
    <div className="flex items-center justify-between border-t border-(--th-border) px-4 py-3">
      <p className="text-sm text-(--th-text-muted)">
        {t('table.pagination.range', { from, to, total })}
      </p>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          icon="ChevronLeft"
          aria-label={t('table.pagination.previous')}
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
        />
        <span className="text-sm text-(--th-text-sub)">
          {t('table.pagination.page', { page, pageCount })}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          icon="ChevronRight"
          aria-label={t('table.pagination.next')}
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
        />
      </div>
    </div>
  )
}
