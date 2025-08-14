'use client'

import { EntityType } from '@/types/entities'

export default function ValidationSummary({
    summaryErrors,
    advancedErrors,
}: {
    summaryErrors: Record<EntityType, string[]>
    advancedErrors?: Record<EntityType, string[]>
}) {
    const blocks = (Object.keys(summaryErrors) as EntityType[])
        .filter((k) => summaryErrors[k]?.length)
        .map((k) => ({ key: k, items: summaryErrors[k] }))

    if (blocks.length === 0) return null

    return (
        <div className="rounded border border-red-300 bg-red-50 dark:bg-red-900/20 p-3">
            <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">
                Validation Summary
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
                {blocks.map((b) => (
                    <div key={b.key}>
                        <div className="font-medium capitalize mb-1">
                            {b.key}
                        </div>
                        <ul className="list-disc pl-5 text-sm">
                            {b.items.map((msg, i) => (
                                <li
                                    key={i}
                                    className="text-red-700 dark:text-red-200"
                                >
                                    {msg}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    )
}
