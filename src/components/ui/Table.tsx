import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'

export interface TableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  getRowKey: (row: T) => string
  loading?: boolean
  skeletonRows?: number
  emptyMessage?: string
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function Table<T>({
  columns,
  data,
  getRowKey,
  loading = false,
  skeletonRows = 8,
  emptyMessage,
  page,
  pageSize,
  total,
  onPageChange,
}: TableProps<T>) {
  const showEmpty = !loading && data.length === 0

  return (
    <div
      className="overflow-hidden rounded-xl border border-(--th-border) bg-(--th-bg-card)"
      style={{ boxShadow: '0 2px 8px rgba(24, 21, 14, 0.04)' }}
    >
      <div className="overflow-x-auto overflow-y-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-(--th-border)">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    'px-4 py-3 text-left text-xs font-medium tracking-wide text-(--th-text-muted) uppercase',
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }).map((_, index) => (
                  <tr
                    key={`skeleton-${index}`}
                    className="border-b border-(--th-border) last:border-0"
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-40" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.map((row) => (
                  <tr
                    key={getRowKey(row)}
                    className="border-b border-(--th-border) last:border-0 hover:bg-(--th-row-hover)"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={clsx(
                          'px-4 py-3 align-top text-(--th-text)',
                          column.className,
                        )}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>

        {showEmpty && (
          <p className="p-10 text-center text-sm text-(--th-text-muted)">
            {emptyMessage}
          </p>
        )}
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        disabled={loading}
      />
    </div>
  )
}
