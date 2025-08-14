import React from 'react'

export default function HeaderMappingModal({
    open,
    mapping, // Record<header, { field?, score }>
    onClose,
    onApply, // (finalMapping) => void
}: {
    open: boolean
    mapping: Record<string, { field?: string; score: number }>
    onClose: () => void
    onApply: (m: Record<string, string>) => void
}) {
    const [local, setLocal] = React.useState<Record<string, string>>(() =>
        Object.fromEntries(
            Object.entries(mapping).map(([h, info]) => [h, info.field ?? ''])
        )
    )

    React.useEffect(
        () =>
            setLocal(
                Object.fromEntries(
                    Object.entries(mapping).map(([h, info]) => [
                        h,
                        info.field ?? '',
                    ])
                )
            ),
        [mapping]
    )

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-900 p-4 rounded shadow max-w-2xl w-full">
                <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">
                    Header Mapping Suggestions
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Match each file header to the correct field name from the
                    expected schema. Leave as is if the suggestion looks
                    correct.
                </p>

                <div className="space-y-2 max-h-64 overflow-auto">
                    {Object.entries(local).map(([orig, chosen]) => (
                        <div key={orig} className="flex gap-2 items-center">
                            <div className="w-40 font-mono text-sm text-gray-800 dark:text-gray-200">
                                {orig}
                            </div>
                            <input
                                className="flex-1 p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                placeholder={
                                    mapping[orig].field
                                        ? `Suggested: ${mapping[orig].field}`
                                        : 'Enter target field name'
                                }
                                value={chosen}
                                onChange={(e) =>
                                    setLocal((s) => ({
                                        ...s,
                                        [orig]: e.target.value,
                                    }))
                                }
                            />
                            <div className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                {mapping[orig].score.toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-3 py-1 rounded border border-gray-400 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onApply(local)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                    >
                        Apply Mapping
                    </button>
                </div>
            </div>
        </div>
    )
}
