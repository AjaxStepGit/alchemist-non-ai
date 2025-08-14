import { EntityType } from '@/types/entities'

const REQUIRED: Record<EntityType, string[]> = {
    clients: ['ClientID', 'PriorityLevel'],
    workers: ['WorkerID', 'AvailableSlots'],
    tasks: ['TaskID', 'Duration'],
    unknown: [],
}

function isValidDate(v: any) {
    if (v == null || v === '') return true // ignore empty
    const t = Date.parse(v)
    return !Number.isNaN(t)
}

export function validateDataAdvanced(data: Record<EntityType, any[]>) {
    const cellErrors: Record<EntityType, Record<string, string>> = {
        clients: {},
        workers: {},
        tasks: {},
        unknown: {},
    }
    const summaryErrors: Record<EntityType, string[]> = {
        clients: [],
        workers: [],
        tasks: [],
        unknown: [],
    }

    ;(['clients', 'workers', 'tasks'] as EntityType[]).forEach((entity) => {
        const rows = data[entity] || []

        // Missing required columns
        const head = Object.keys(rows[0] ?? {})
        const missing = REQUIRED[entity].filter((c) => !head.includes(c))
        if (missing.length) {
            summaryErrors[entity].push(
                `Missing required columns: ${missing.join(', ')}`
            )
        }

        // Duplicate IDs
        const idKey =
            entity === 'clients'
                ? 'ClientID'
                : entity === 'workers'
                ? 'WorkerID'
                : 'TaskID'
        const seen = new Set<string>()
        const dups: string[] = []
        rows.forEach((r) => {
            if (!r || typeof r !== 'object') return // skip bad rows
            const id = String(r[idKey] ?? '')
            if (!id) return
            if (seen.has(id)) dups.push(id)
            seen.add(id)
        })
        if (dups.length) {
            summaryErrors[entity].push(
                `Duplicate ${idKey} values: ${[...new Set(dups)].join(', ')}`
            )
        }

        // Per-row checks
        rows.forEach((row, i) => {
            if (!row || typeof row !== 'object') return

            if (entity === 'clients' && 'PriorityLevel' in row) {
                const n = Number(row.PriorityLevel)
                if (Number.isNaN(n) || n < 1 || n > 5) {
                    cellErrors.clients[`${i}-PriorityLevel`] =
                        'PriorityLevel must be between 1 and 5'
                }
            }

            if (entity === 'tasks') {
                if ('Duration' in row) {
                    const n = Number(row.Duration)
                    if (Number.isNaN(n) || n < 1) {
                        cellErrors.tasks[`${i}-Duration`] =
                            'Duration must be a number ≥ 1'
                    }
                }
                // basic date fields if present
                ;['StartDate', 'EndDate'].forEach((k) => {
                    if (k in row && !isValidDate(row[k])) {
                        cellErrors.tasks[
                            `${i}-${k}`
                        ] = `${k} is not a valid date`
                    }
                })
            }

            if (entity === 'workers') {
                if ('AvailableSlots' in row) {
                    const v = row.AvailableSlots
                    const empty =
                        v == null ||
                        v === '' ||
                        (Array.isArray(v) && v.length === 0)
                    if (empty) {
                        cellErrors.workers[`${i}-AvailableSlots`] =
                            'AvailableSlots must not be empty'
                    }
                }
            }
        })
    })

    // Cross-table checks (unknown references)
    const workerIds = new Set(
        (data.workers ?? [])
            .filter((w) => w && typeof w === 'object')
            .map((w) => String(w.WorkerID ?? ''))
    )
    const tasks = data.tasks ?? []
    tasks.forEach((t, i) => {
        if (t.AssignedWorkerID != null && t.AssignedWorkerID !== '') {
            const wid = String(t.AssignedWorkerID)
            if (!workerIds.has(wid)) {
                summaryErrors.tasks.push(
                    `Task ${
                        t.TaskID ?? '(row ' + (i + 1) + ')'
                    } references missing WorkerID ${wid}`
                )
            }
        }
    })

    return { cellErrors, summaryErrors }
}
