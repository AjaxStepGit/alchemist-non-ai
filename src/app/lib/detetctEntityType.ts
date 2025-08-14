export type EntityType = 'clients' | 'workers' | 'tasks' | 'unknown'

export const detectEntityType = (headers: string[]): EntityType => {
    const lower = headers.map((h) =>
        h
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .trim()
    )

    if (lower.includes('clientid') && lower.includes('prioritylevel'))
        return 'clients'
    if (lower.includes('workerid') && lower.includes('skills')) return 'workers'
    if (lower.includes('taskid') && lower.includes('category')) return 'tasks'

    return 'unknown'
}
