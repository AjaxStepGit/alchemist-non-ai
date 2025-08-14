import type { RulesConfig } from '../page'

export function validateRules(rules: RulesConfig, data: Record<string, any[]>) {
    const problems: string[] = []

    const taskIds = new Set(
        (data.tasks ?? []).map((t) => String(t.TaskID ?? ''))
    )
    const workerIds = new Set(
        (data.workers ?? []).map((w) => String(w.WorkerID ?? ''))
    )

    // coRun: all tasks must exist; detect duplicates/cycles (simple)
    rules.rules.forEach((r, idx) => {
        if (r.type === 'coRun') {
            const missing = r.tasks.filter((t) => !taskIds.has(String(t)))
            if (missing.length) {
                problems.push(
                    `Rule #${idx + 1} (coRun): missing task IDs: ${missing.join(
                        ', '
                    )}`
                )
            }
            // trivial cycle flag if same task appears twice in one rule
            const set = new Set(r.tasks)
            if (set.size !== r.tasks.length) {
                problems.push(
                    `Rule #${idx + 1} (coRun): duplicate task IDs in rule.`
                )
            }
        }

        if (r.type === 'slotRestriction') {
            if (!r.group)
                problems.push(
                    `Rule #${idx + 1} (slotRestriction): group is empty`
                )
            if (!(r.minCommonSlots >= 1))
                problems.push(
                    `Rule #${
                        idx + 1
                    } (slotRestriction): minCommonSlots must be ≥ 1`
                )
        }

        if (r.type === 'loadLimit') {
            if (!r.workerGroup)
                problems.push(
                    `Rule #${idx + 1} (loadLimit): workerGroup is empty`
                )
            if (!(r.maxSlotsPerPhase >= 1))
                problems.push(
                    `Rule #${idx + 1} (loadLimit): maxSlotsPerPhase must be ≥ 1`
                )
        }
    })

    // (Optional) check rules contradict each other — basic placeholder example
    // You can extend with your business constraints.

    return problems
}
