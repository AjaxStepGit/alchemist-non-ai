// /lib/headerMapper.ts
import stringSimilarity from 'string-similarity'
import { SCHEMAS } from './schemas'
import { normalize } from './normalizeHeader'
import { EntityType } from '@/types/entities'

export interface MappingResult {
    mapping: Record<string, { field?: string; score: number }>
    avgScore: number
    mappedCount: number
    entity: EntityType
}

const buildCandidates = (entity: EntityType) => {
    const map: Record<string, string> = {}
    const entries = SCHEMAS[entity]
    Object.entries(entries).forEach(([canon, syns]) => {
        // include canonical name too
        map[normalize(canon)] = canon
        syns.forEach((s) => (map[normalize(s)] = canon))
    })
    return map // normalized -> canonical
}

export function mapHeadersToEntity(
    headers: string[],
    entity: EntityType
): MappingResult {
    const candidates = buildCandidates(entity) // normalized -> canonical
    const result: Record<string, { field?: string; score: number }> = {}
    let total = 0
    let mapped = 0

    const candidateKeys = Object.keys(candidates)

    headers.forEach((h) => {
        const n = normalize(h)
        // exact map
        if (candidates[n]) {
            result[h] = { field: candidates[n], score: 1.0 }
            total += 1
            mapped++
            return
        }

        // fuzzy compare header against candidateKeys and canonical names
        // build list to compare: candidateKeys (normalized strings)
        const { bestMatch } = stringSimilarity.findBestMatch(n, candidateKeys)
        const score = bestMatch.rating // 0..1
        const mappedField =
            score > 0.55 ? candidates[bestMatch.target] : undefined

        result[h] = { field: mappedField, score }
        total += score
        if (mappedField) mapped++
    })

    const avgScore = headers.length ? total / headers.length : 0
    return { mapping: result, avgScore, mappedCount: mapped, entity }
}
