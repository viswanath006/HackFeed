/**
 * components/admin/DataTable.tsx
 *
 * Generic Tailwind table for the admin panel.
 * Accepts typed columns + rows; handles empty state.
 */

import React from "react"

export interface Column<T> {
  key: string
  header: string
  /** Width hint e.g. "w-48" "w-24" "min-w-0" */
  width?: string
  render: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  keyExtractor: (row: T) => string
  emptyMessage?: string
}

export default function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/8 bg-white/[0.03]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 ${col.width ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-zinc-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="transition-colors hover:bg-white/[0.03]"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.width ?? ""}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
