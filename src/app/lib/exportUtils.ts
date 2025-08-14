import Papa from 'papaparse'

export function downloadFile(
    filename: string,
    content: string,
    type = 'text/csv'
) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export function exportCSV(entityName: string, data: any[]) {
    if (data.length === 0) return
    const csv = Papa.unparse(data)
    downloadFile(`${entityName}.csv`, csv)
}

export function exportJSON(filename: string, data: any) {
    const jsonString = JSON.stringify(data, null, 2)
    downloadFile(filename, jsonString, 'application/json')
}
