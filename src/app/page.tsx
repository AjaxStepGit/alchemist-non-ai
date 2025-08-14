'use client'

import { useEffect, useMemo, useState } from 'react'
import FileUploader from './components/FileUploader'
import EditableTable from './components/EditableTable'
import RulesEditor from './components/RulesEditor'
import { exportCSV, exportJSON } from './lib/exportUtils'
import { validateRules } from './lib/validateRules'
import { useToast } from '@/hooks/useToast'
import { EntityType } from '@/types/entities'
import ValidationSummary from './components/ValidationSummary'
import { validateDataAdvanced } from './lib/validateData'
// import { validateRulesAdvanced } from './lib/advancedValidation'

export type Rule =
    | { type: 'coRun'; tasks: string[] }
    | { type: 'slotRestriction'; group: string; minCommonSlots: number }
    | { type: 'loadLimit'; workerGroup: string; maxSlotsPerPhase: number }

export type RulesConfig = {
    rules: Rule[]
    priorities: Record<string, number>
}

export default function Home() {
    const [data, setData] = useState<Record<EntityType, any[]>>({
        clients: [],
        workers: [],
        tasks: [],
        unknown: [],
    })

    const [originalData, setOriginalData] = useState<Record<EntityType, any[]>>(
        {
            clients: [],
            workers: [],
            tasks: [],
            unknown: [],
        }
    )

    const [activeTab, setActiveTab] = useState<EntityType>('clients')
    const [loading, setLoading] = useState(false)

    const toast = useToast()

    const [rulesConfig, setRulesConfig] = useState<RulesConfig>({
        rules: [],
        priorities: { priorityWeight: 1, durationWeight: 1, distanceWeight: 1 },
    })

    useEffect(() => {
        console.log('Current rules config:', rulesConfig)
        // Log rules config changes for debugging
    }, [rulesConfig])

    // per-cell errors for the active table + global summary
    const { cellErrors, summaryErrors } = useMemo(
        () => validateDataAdvanced(data),
        [data]
    )

    const handleDataParsed = (type: EntityType, parsedData: any[]) => {
        setData((prev) => ({ ...prev, [type]: parsedData }))
        setOriginalData((prev) => ({ ...prev, [type]: parsedData }))
        toast('success', `Loaded ${parsedData.length} ${type} row(s).`)
    }

    const handleExport = async () => {
        // Block export if any validation errors exist
        const hasErrors =
            Object.values(cellErrors).some(
                (category) => Object.keys(category).length > 0
            ) || Object.values(summaryErrors).some((arr) => arr.length > 0)

        if (hasErrors) {
            toast('danger', 'Please fix validation errors before exporting.')
            console.log('Validation errors:', {
                cellErrors,
                summaryErrors,
            })
            return
        }

        // Validate rules against current data (no mutation)
        const ruleProblems = validateRules(rulesConfig, data)
        if (ruleProblems.length > 0) {
            toast('warning', 'Cannot export:\n' + ruleProblems.join('\n'))
            return
        }

        // const advanceRuleProblems = validateRulesAdvanced(rulesConfig, data)
        // if (ruleProblems.length > 0) {
        //     toast(
        //         'warning',
        //         'Cannot export:\n' + advanceRuleProblems.join('\n')
        //     )
        //     return
        // }

        if (
            !data.clients.length &&
            !data.workers.length &&
            !data.tasks.length &&
            !data.unknown.length
        ) {
            toast('warning', 'No data available to export.')
            return
        }

        setLoading(true)
        setTimeout(() => {
            if (data.clients.length) exportCSV('clients.csv', data.clients)
            if (data.workers.length) exportCSV('workers.csv', data.workers)
            if (data.tasks.length) exportCSV('tasks.csv', data.tasks)
            if (data.unknown.length) exportCSV('unknown.csv', data.unknown)
            exportJSON('rules.json', rulesConfig)
            setLoading(false)
            toast('success', 'Data & rules exported successfully!')
        }, 700)
    }

    const handleCellChange = (
        type: EntityType,
        rowIndex: number,
        columnId: string,
        value: any
    ) => {
        const updated = [...data[type]]
        updated[rowIndex] = { ...updated[rowIndex], [columnId]: value }
        setData((prev) => ({ ...prev, [type]: updated }))
    }

    // APPLY (validate only; do not mutate tables)
    const applyRulesToData = (rules: RulesConfig) => {
        let newData = JSON.parse(JSON.stringify(data)) // clone current data

        // Map numeric priority to text label
        const priorityMap: Record<number, string> = {
            1: 'Very Low',
            2: 'Low',
            3: 'Moderate',
            4: 'High',
            5: 'Very High',
        }

        console.log('Rules', rules)

        rules.rules.forEach((rule) => {
            if (rule.type === 'coRun') {
                newData.tasks = newData.tasks.map((task: any) =>
                    rule.tasks.includes(task.TaskID)
                        ? { ...task, CoRunGroup: rule.tasks.join(',') }
                        : task
                )
            }
            if (rule.type === 'slotRestriction') {
                newData.workers = newData.workers.map((worker: any) => {
                    // Ensure slots is always an array
                    const slots = Array.isArray(worker.AvailableSlots)
                        ? worker.AvailableSlots
                        : (() => {
                              try {
                                  return JSON.parse(worker.AvailableSlots)
                              } catch {
                                  return []
                              }
                          })()

                    // Determine validity
                    const valid =
                        worker.WorkerGroup !== rule.group ||
                        slots.length >= rule.minCommonSlots

                    // Add the flag
                    return { ...worker, SlotRestrictionValid: valid }
                })
            }

            if (rule.type === 'loadLimit') {
                newData.workers = newData.workers.map((worker: any) => {
                    return worker.WorkerGroup === rule.workerGroup
                        ? {
                              ...worker,
                              MaxLoadPerPhase: rule.maxSlotsPerPhase,
                          }
                        : worker
                })
            }
        })

        console.log('New data after applying rules:', newData)

        const selectedPriority = rules.priorities.priorityWeight

        newData.clients = newData.clients
            .map((client: any) => ({
                ...client,
                PriorityLabel:
                    priorityMap[Number(client.PriorityLevel)] || 'Moderate',
            }))
            .sort((a: any, b: any) => {
                const aDiff = Number(b.PriorityLevel) - Number(a.PriorityLevel)
                // Bring selected priority to top
                if (Number(a.PriorityLevel) === selectedPriority) return -1
                if (Number(b.PriorityLevel) === selectedPriority) return 1
                return aDiff
            })
        const selectedDurationWeight = rules.priorities.durationWeight

        newData.tasks = newData.tasks
            .map((task: any) => ({ ...task }))
            .sort((a: any, b: any) => {
                const aScore =
                    a.Duration == selectedDurationWeight ? 1000 : a.Duration
                const bScore =
                    b.Duration == selectedDurationWeight ? 1000 : b.Duration
                return bScore - aScore
            })

        setData(newData)
        toast('success', 'Rules applied to tables!')
    }

    const resetData = () => {
        setData(JSON.parse(JSON.stringify(originalData)))
        toast('success', 'Data reset to original state.')
    }

    const resetRules = () => {
        setRulesConfig({
            rules: [],
            priorities: {
                priorityWeight: 1,
                durationWeight: 1,
                distanceWeight: 1,
            },
        })
        toast('success', 'Rules reset.')
    }

    const getColumns = (sampleRow: any) =>
        Object.keys(sampleRow || {}).map((key) => ({
            accessorKey: key,
            header: key,
        }))

    const entityTabs: EntityType[] = ['clients', 'workers', 'tasks', 'unknown']

    const visibleTabs = entityTabs.filter((t) => data[t].length > 0)
    const safeActive = visibleTabs.includes(activeTab)
        ? activeTab
        : visibleTabs[0] ?? 'clients'

    return (
        <div className="flex flex-col h-full gap-4 w-full p-4">
            <h1 className="text-2xl font-black text-center">DATA ALCHEMIST</h1>

            <div className="flex flex-col gap-3">
                <FileUploader onDataParsed={handleDataParsed} />

                <RulesEditor
                    rulesConfig={rulesConfig}
                    onChange={setRulesConfig}
                    onApplyRules={applyRulesToData}
                    onResetRules={resetRules}
                    data={data}
                />

                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Export Data & Rules
                    </button>
                    <button
                        onClick={resetData}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Reset Data
                    </button>
                </div>

                {loading && (
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        <span>Processing…</span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-2 border-b border-gray-300">
                {visibleTabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 capitalize ${
                            safeActive === tab
                                ? 'border-b-2 border-blue-500 font-bold text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
                {visibleTabs.length === 0 && (
                    <span className="text-sm text-gray-500">
                        Upload data to see tables
                    </span>
                )}
            </div>

            {/* Validation summary (global) */}
            <ValidationSummary summaryErrors={summaryErrors} />

            {/* Active Table */}
            <div className="mt-2">
                {safeActive && data[safeActive].length > 0 && (
                    <EditableTable
                        data={data[safeActive]}
                        columns={getColumns(data[safeActive][0])}
                        onCellChange={(row, col, val) =>
                            handleCellChange(safeActive, row, col, val)
                        }
                        validationErrors={cellErrors[safeActive] ?? {}}
                        rulesConfig={rulesConfig}
                    />
                )}
            </div>
        </div>
    )
}
