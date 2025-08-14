import { RulesConfig } from '../page'
import { validateRules } from './validateRules'

export function checkPhaseSlotSaturation(tasks: any[], workers: any[]) {
    const totalSlots = workers.reduce(
        (acc, w) => acc + (w.AvailableSlots?.length || 0),
        0
    )
    const totalTaskDuration = tasks.reduce(
        (acc, t) => acc + (t.Duration || 0),
        0
    )
    return totalTaskDuration > totalSlots
        ? [
              `Phase-slot saturation violated: total task durations (${totalTaskDuration}) exceed worker slots (${totalSlots})`,
          ]
        : []
}

export function checkSkillCoverage(tasks: any[], workers: any[]) {
    const availableSkills = new Set<string>()
    workers.forEach((w) =>
        w.Skills?.forEach((s: string) => availableSkills.add(s))
    )
    const errors: string[] = []
    tasks.forEach((task) => {
        const missing = (task.RequiredSkills || []).filter(
            (s: any) => !availableSkills.has(s)
        )
        if (missing.length)
            errors.push(
                `Task ${task.TaskID} missing skills: ${missing.join(', ')}`
            )
    })
    return errors
}

export function checkMaxConcurrency(tasks: any[], workers: any[]) {
    const errors: string[] = []
    tasks.forEach((task) => {
        const qualifiedWorkers = workers.filter((w) =>
            (task.RequiredSkills || []).every((skill: any) =>
                w.Skills?.includes(skill)
            )
        )
        if ((task.MaxConcurrent || 0) > qualifiedWorkers.length)
            errors.push(
                `Task ${task.TaskID} MaxConcurrent (${task.MaxConcurrent}) exceeds available workers (${qualifiedWorkers.length})`
            )
    })
    return errors
}

export function validateRulesAdvanced(rulesConfig: RulesConfig, data: any) {
    const errors: string[] = []
    errors.push(...validateRules(rulesConfig, data))
    errors.push(...checkPhaseSlotSaturation(data.tasks, data.workers))
    // errors.push(...checkSkillCoverage(data.tasks, data.workers)) // this line gave error in the original code
    // errors.push(...checkMaxConcurrency(data.tasks, data.workers))
    return errors
}
