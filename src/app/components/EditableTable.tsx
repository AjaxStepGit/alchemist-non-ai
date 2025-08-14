'use client'

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'
import * as React from 'react'
import { checkRuleViolation } from '../lib/checkRuleViolation'
import type { RulesConfig } from '../page'

interface EditableTableProps {
    data: any[]
    columns: ColumnDef<any, any>[]
    onCellChange: (rowIndex: number, columnId: string, value: any) => void
    validationErrors?: Record<string, string> // for the current entity only
    rulesConfig?: RulesConfig
    advancedErrors?: Record<number, string[]>
}

export default function EditableTable({
    columns,
    data,
    onCellChange,
    validationErrors = {},
    rulesConfig,
    advancedErrors,
}: EditableTableProps) {
    const [editingCell, setEditingCell] = React.useState<string | null>(null)
    const [tempValue, setTempValue] = React.useState<string>('')

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    const startEdit = (cellKey: string, initialValue: string) => {
        setEditingCell(cellKey)
        setTempValue(String(initialValue ?? ''))
    }

    const commitEdit = (rowIndex: number, columnId: string) => {
        if (rulesConfig) {
            const violation = checkRuleViolation(
                rulesConfig,
                data,
                rowIndex,
                columnId,
                tempValue
            )
            if (violation) {
                alert(violation)
                setEditingCell(null)
                setTempValue('')
                return
            }
        }
        onCellChange(rowIndex, columnId, tempValue)
        setEditingCell(null)
        setTempValue('')
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-300">
            <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className="px-3 py-2 text-left font-bold"
                                >
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="border-t border-gray-200">
                            {row.getVisibleCells().map((cell) => {
                                const cellKey = `${row.index}-${cell.column.id}`
                                const isInvalid = Boolean(
                                    validationErrors[cellKey]
                                )
                                const cellValue = cell.getValue() as any
                                const rowViolations =
                                    advancedErrors?.[row.index] ?? []

                                return (
                                    <td
                                        key={cell.id}
                                        className={`px-3 py-2 cursor-pointer ${
                                            isInvalid
                                                ? 'bg-red-100 border border-red-500'
                                                : ''
                                        }`}
                                        title={
                                            isInvalid
                                                ? validationErrors[cellKey]
                                                : undefined
                                        }
                                    >
                                        {editingCell === cellKey ? (
                                            <input
                                                className="w-full bg-white text-black px-1 py-0.5 outline-none"
                                                value={tempValue}
                                                autoFocus
                                                onChange={(e) =>
                                                    setTempValue(e.target.value)
                                                }
                                                onBlur={() =>
                                                    commitEdit(
                                                        row.index,
                                                        cell.column.id
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter')
                                                        commitEdit(
                                                            row.index,
                                                            cell.column.id
                                                        )
                                                    if (e.key === 'Escape') {
                                                        setEditingCell(null)
                                                        setTempValue('')
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <>
                                                {String(cellValue ?? '')}
                                                {isInvalid && (
                                                    <p className="text-xs text-red-600 mt-1">
                                                        {
                                                            validationErrors[
                                                                cellKey
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                                {rowViolations.length > 0 && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        {rowViolations.join(
                                                            '; '
                                                        )}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
