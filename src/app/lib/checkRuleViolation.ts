import type { RulesConfig } from '../page'

/**
 * Prevent committing a single-cell edit if it clearly breaks a rule.
 * Keep it lightweight (no table mutations here).
 */
export function checkRuleViolation(
    rules: RulesConfig,
    entityRows: any[],
    rowIndex: number,
    columnId: string,
    newValue: any
): string | null {
    const row = entityRows[rowIndex]
    const nextRow = { ...row, [columnId]: newValue }

    // Example: forbid Duration < 1 even if user tries to bypass global validation
    if (columnId === 'Duration') {
        const n = Number(newValue)
        if (Number.isNaN(n) || n < 1) {
            return 'Duration must be a number ≥ 1.'
        }
    }

    // Example: if a loadLimit rule caps MaxLoadPerPhase and user edits that upwards in workers
    if (columnId === 'MaxLoadPerPhase') {
        const limitRules = rules.rules.filter((r) => r.type === 'loadLimit')
        for (const r of limitRules as any[]) {
            // if you had a GroupTag on the row, you could enforce here
            if (
                nextRow.GroupTag === r.workerGroup &&
                Number(newValue) > r.maxSlotsPerPhase
            ) {
                return `MaxLoadPerPhase cannot exceed ${r.maxSlotsPerPhase} for group ${r.workerGroup}.`
            }
        }
    }

    return null
}
