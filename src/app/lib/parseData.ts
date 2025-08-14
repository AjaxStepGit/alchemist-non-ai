import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { detectEntityType, EntityType } from './detetctEntityType'
import { mapHeadersToEntity } from './headerMapper'
import { remapRows } from './remapData'
import { SCHEMAS } from './schemas' // expected schema

export interface ParsedResult {
    type: EntityType
    data: any[]
    error?: string
}

export const parseFile = (file: File): Promise<ParsedResult[]> => {
    return new Promise((resolve) => {
        const results: ParsedResult[] = []

        const processData = (jsonData: any[]) => {
            const rawHeaders = Object.keys(jsonData[0] || {})
            let type = detectEntityType(rawHeaders)
            let mappingInfo = undefined

            if (type === 'unknown') {
                const candidates: EntityType[] = ['clients', 'workers', 'tasks']
                const resultsMap = candidates.map((c) =>
                    mapHeadersToEntity(rawHeaders, c)
                )

                // Pick best by avgScore & mappedCount
                const best = resultsMap.sort(
                    (a, b) => b.avgScore - a.avgScore
                )[0]
                if (
                    best.avgScore >= 0.55 &&
                    best.mappedCount >=
                        Math.max(
                            1,
                            Object.keys(SCHEMAS[best.entity]).length / 2
                        )
                ) {
                    type = best.entity
                    mappingInfo = best
                    jsonData = remapRows(jsonData, best.mapping) // remap to correct headers
                } else {
                    // Keep type unknown but suggest mapping
                    mappingInfo = best
                }
            }

            results.push({
                type,
                data: jsonData,
                ...(type === 'unknown'
                    ? {
                          error: 'Could not confidently map headers',
                          mappingInfo,
                      }
                    : {}),
            })
        }

        if (file.name.toLowerCase().endsWith('.csv')) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (result: any) => {
                    processData(result.data)
                    resolve(results)
                },
                error: (err: any) => {
                    results.push({
                        type: 'unknown',
                        data: [],
                        error: err.message,
                    })
                    resolve(results)
                },
            })
        } else if (file.name.toLowerCase().endsWith('.xlsx')) {
            const reader = new FileReader()
            reader.onload = (evt) => {
                try {
                    const bstr = evt.target?.result
                    const workbook = XLSX.read(bstr, { type: 'binary' })

                    workbook.SheetNames.forEach((sheetName) => {
                        const jsonData = XLSX.utils.sheet_to_json(
                            workbook.Sheets[sheetName],
                            { defval: '', raw: false }
                        )
                        processData(jsonData)
                    })

                    resolve(results)
                } catch (err: any) {
                    results.push({
                        type: 'unknown',
                        data: [],
                        error: err.message,
                    })
                    resolve(results)
                }
            }
            reader.readAsBinaryString(file)
        } else {
            results.push({
                type: 'unknown',
                data: [],
                error: 'Unsupported file type. Please upload a .csv or .xlsx file.',
            })
            resolve(results)
        }
    })
}
