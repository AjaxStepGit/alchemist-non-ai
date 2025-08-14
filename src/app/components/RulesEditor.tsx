'use client'

import { useState, useMemo } from 'react'
import type { Rule, RulesConfig } from '../page'

interface Props {
    rulesConfig: RulesConfig
    onChange: (config: RulesConfig) => void
    onApplyRules: (rules: RulesConfig) => void
    onResetRules: () => void
    data: any
}

export default function RulesEditor({
    rulesConfig,
    onChange,
    onApplyRules,
    onResetRules,
    data,
}: Props) {
    const [newRuleType, setNewRuleType] = useState<Rule['type']>('coRun')
    const [selectedRuleIndex, setSelectedRuleIndex] = useState<number | null>(
        null
    )
    const [filterType, setFilterType] = useState<'all' | 'violations'>('all')

    // ------------------------------
    // RULE EDITING LOGIC
    // ------------------------------
    const addRule = () => {
        let newRule: Rule
        if (newRuleType === 'coRun') {
            newRule = { type: 'coRun', tasks: [] }
        } else if (newRuleType === 'slotRestriction') {
            newRule = { type: 'slotRestriction', group: '', minCommonSlots: 1 }
        } else {
            newRule = {
                type: 'loadLimit',
                workerGroup: '',
                maxSlotsPerPhase: 1,
            }
        }
        onChange({ ...rulesConfig, rules: [...rulesConfig.rules, newRule] })
    }

    const updateRule = (index: number, updated: Rule) => {
        const updatedRules = [...rulesConfig.rules]
        updatedRules[index] = updated
        onChange({ ...rulesConfig, rules: updatedRules })
    }

    const deleteRule = (index: number) => {
        onChange({
            ...rulesConfig,
            rules: rulesConfig.rules.filter((_, i) => i !== index),
        })
    }

    const updatePriority = (key: string, value: number) => {
        onChange({
            ...rulesConfig,
            priorities: { ...rulesConfig.priorities, [key]: value },
        })
    }

    // ------------------------------
    // FILTER / PREVIEW LOGIC
    // ------------------------------
    const getAffectedRows = () => {
        if (selectedRuleIndex === null) return { tasks: [], workers: [] }
        const rule = rulesConfig.rules[selectedRuleIndex]
        if (!rule) return { tasks: [], workers: [] }

        let affectedTasks: any[] = []
        let affectedWorkers: any[] = []

        if (rule.type === 'coRun') {
            affectedTasks =
                data.tasks?.filter((t: any) => rule.tasks.includes(t.TaskID)) ||
                []
        } else if (rule.type === 'slotRestriction') {
            affectedWorkers =
                data.workers?.filter(
                    (w: any) => w.WorkerGroup === rule.group
                ) || []
        } else if (rule.type === 'loadLimit') {
            affectedWorkers =
                data.workers?.filter(
                    (w: any) => w.WorkerGroup === rule.workerGroup
                ) || []
        }

        // Optional: filter only violations
        if (filterType === 'violations') {
            if (rule.type === 'slotRestriction') {
                affectedWorkers = affectedWorkers.filter(
                    (w: any) =>
                        !Array.isArray(w.AvailableSlots) ||
                        w.AvailableSlots.length < rule.minCommonSlots
                )
            }
            // Add other rule violation checks here if needed
        }

        return { tasks: affectedTasks, workers: affectedWorkers }
    }

    const { tasks: affectedTasks, workers: affectedWorkers } = useMemo(
        getAffectedRows,
        [selectedRuleIndex, filterType, rulesConfig, data]
    )

    return (
        <div className="p-4 border rounded bg-gray-50 dark:bg-gray-800 dark:text-white">
            {/* ----------------- RULES HEADER ----------------- */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold mb-2">Rules & Priorities</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => onApplyRules(rulesConfig)}
                        className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                        Validate Rules
                    </button>
                    <button
                        onClick={onResetRules}
                        className="px-3 py-1 bg-gray-600 text-white rounded"
                    >
                        Reset Rules
                    </button>
                </div>
            </div>

            {/* ----------------- PRIORITIES ----------------- */}
            <div className="grid md:grid-cols-2 gap-3 mb-4">
                <label className="flex flex-col gap-1">
                    <span className="text-sm">Priority</span>
                    <select
                        className="border rounded p-1 dark:bg-gray-700 h-[34px]"
                        onChange={(e) =>
                            updatePriority(
                                'priorityWeight',
                                Number(e.target.value)
                            )
                        }
                    >
                        <option value={1}>Very Low</option>
                        <option value={2}>Low</option>
                        <option value={3}>Moderate</option>
                        <option value={4}>High</option>
                        <option value={5}>Very High</option>
                    </select>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-sm">Duration Weight</span>
                    <input
                        type="number"
                        min={0}
                        step={0.1}
                        className="border rounded p-1 dark:bg-gray-700"
                        onChange={(e) =>
                            updatePriority(
                                'durationWeight',
                                Number(e.target.value)
                            )
                        }
                    />
                </label>
            </div>

            {/* ----------------- ADD RULE ----------------- */}
            <div className="flex gap-2 mb-3">
                <select
                    value={newRuleType}
                    onChange={(e) =>
                        setNewRuleType(e.target.value as Rule['type'])
                    }
                    className="border p-1 rounded bg-gray-50 dark:bg-gray-700"
                >
                    <option value="coRun">Co-run Tasks</option>
                    <option value="slotRestriction">Slot Restriction</option>
                    <option value="loadLimit">Load Limit</option>
                </select>
                <button
                    onClick={addRule}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                    Add Rule
                </button>
            </div>

            {/* ----------------- EXISTING RULES ----------------- */}
            {rulesConfig.rules.length === 0 && (
                <p className="text-sm text-gray-400">No rules added yet.</p>
            )}
            {rulesConfig.rules.map((rule, index) => (
                <div
                    key={index}
                    className="border p-2 rounded mb-2 flex flex-col gap-2 bg-white dark:bg-gray-700"
                >
                    <div className="flex items-center justify-between">
                        <strong>Type: {rule.type}</strong>
                        <button
                            onClick={() => deleteRule(index)}
                            className="px-2 py-1 bg-red-600 text-white rounded"
                        >
                            Delete
                        </button>
                    </div>

                    {rule.type === 'coRun' && (
                        <input
                            placeholder="Comma-separated task IDs (e.g., T1, T2, T3)"
                            onChange={(e) =>
                                updateRule(index, {
                                    ...rule,
                                    tasks: e.target.value
                                        .split(',')
                                        .map((t) => t.trim())
                                        .filter(Boolean),
                                })
                            }
                            className="border p-1 rounded w-full dark:bg-gray-600"
                        />
                    )}

                    {rule.type === 'slotRestriction' && (
                        <div className="grid sm:grid-cols-2 gap-2">
                            <input
                                placeholder="Group name"
                                value={(rule as any).group}
                                onChange={(e) =>
                                    updateRule(index, {
                                        ...rule,
                                        group: e.target.value,
                                    })
                                }
                                className="border p-1 rounded dark:bg-gray-600"
                            />
                            <input
                                type="number"
                                placeholder="Min common slots"
                                value={(rule as any).minCommonSlots}
                                onChange={(e) =>
                                    updateRule(index, {
                                        ...rule,
                                        minCommonSlots: Number(e.target.value),
                                    })
                                }
                                className="border p-1 rounded dark:bg-gray-600"
                            />
                        </div>
                    )}

                    {rule.type === 'loadLimit' && (
                        <div className="grid sm:grid-cols-2 gap-2">
                            <input
                                placeholder="Worker group"
                                value={(rule as any).workerGroup}
                                onChange={(e) =>
                                    updateRule(index, {
                                        ...rule,
                                        workerGroup: e.target.value,
                                    })
                                }
                                className="border p-1 rounded dark:bg-gray-600"
                            />
                            <input
                                type="number"
                                placeholder="Max slots per phase"
                                value={(rule as any).maxSlotsPerPhase}
                                onChange={(e) =>
                                    updateRule(index, {
                                        ...rule,
                                        maxSlotsPerPhase: Number(
                                            e.target.value
                                        ),
                                    })
                                }
                                className="border p-1 rounded dark:bg-gray-600"
                            />
                        </div>
                    )}
                </div>
            ))}

            {/* ----------------- FILTER / PREVIEW SECTION ----------------- */}
            <div className="mt-4 p-2 border rounded bg-gray-100 dark:bg-gray-700">
                <h4 className="font-medium mb-2">Preview / Filter</h4>

                <div className="flex gap-2 mb-2">
                    <select
                        value={selectedRuleIndex ?? ''}
                        onChange={(e) =>
                            setSelectedRuleIndex(Number(e.target.value))
                        }
                        className="border p-1 rounded bg-white dark:bg-gray-600"
                    >
                        <option value="">-- Select Rule --</option>
                        {rulesConfig.rules.map((r, i) => (
                            <option key={i} value={i}>
                                {i + 1}: {r.type}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filterType}
                        onChange={(e) =>
                            setFilterType(
                                e.target.value as 'all' | 'violations'
                            )
                        }
                        className="border p-1 rounded bg-white dark:bg-gray-600"
                    >
                        <option value="all">All Affected</option>
                        <option value="violations">Only Violations</option>
                    </select>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-300">
                    <p>Tasks affected: {affectedTasks.length}</p>
                    <p>Workers affected: {affectedWorkers.length}</p>
                </div>
            </div>
        </div>
    )
}
