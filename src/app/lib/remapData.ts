export function remapRows(
    rows: any[],
    mapping: Record<string, { field?: string }>
) {
    return rows.map((row) => {
        const newRow: Record<string, any> = {}

        Object.entries(row).forEach(([origKey, val]) => {
            // Try exact match first
            let mapInfo = mapping[origKey]

            // Try case-insensitive match if no exact match
            if (!mapInfo) {
                const foundKey = Object.keys(mapping).find(
                    (k) => k.toLowerCase() === origKey.toLowerCase()
                )
                if (foundKey) {
                    mapInfo = mapping[foundKey]
                }
            }

            const outKey = mapInfo?.field ?? origKey // if unmapped, keep original
            newRow[outKey] = val
        })

        return newRow
    })
}
