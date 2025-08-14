'use client'

import { useState } from 'react'
import { parseFile } from '../lib/parseData'
import { EntityType } from '@/types/entities'
import HeaderMappingModal from './HeaderMappingModal'
import { remapRows } from '../lib/remapData'

interface Props {
    onDataParsed: (type: EntityType, data: any[]) => void
}

export default function FileUploader({ onDataParsed }: Props) {
    const [errors, setErrors] = useState<string[]>([])
    const [mappingModalOpen, setMappingModalOpen] = useState(false)
    const [pendingMapping, setPendingMapping] = useState<any>(null)
    const [pendingEntity, setPendingEntity] = useState<EntityType>('unknown')
    const [pendingRows, setPendingRows] = useState<any[]>([])

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = event.target.files
        if (!files) return
        setErrors([])

        for (const file of Array.from(files)) {
            const results = await parseFile(file)

            results.forEach((res: any) => {
                if (res.type === 'unknown') {
                    if (res.mappingInfo) {
                        // Open modal for mapping
                        setMappingModalOpen(true)
                        setPendingMapping(res.mappingInfo.mapping)
                        setPendingEntity(res.mappingInfo.entity)
                        setPendingRows(res.data)
                    } else {
                        setErrors((prev) => [
                            ...prev,
                            `${file.name}: ${
                                res.error || 'Could not detect file type.'
                            }`,
                        ])
                    }
                } else {
                    onDataParsed(res.type, res.data)
                }
            })
        }
    }

    const handleMappingApply = (finalMapping: Record<string, string>) => {
        const remapped = remapRows(
            pendingRows,
            Object.fromEntries(
                Object.entries(finalMapping).map(([k, v]) => [k, { field: v }])
            )
        )
        onDataParsed(pendingEntity, remapped)
        setMappingModalOpen(false)
        setPendingMapping(null)
        setPendingRows([])
    }

    return (
        <div className="flex flex-col gap-2">
            <input
                type="file"
                multiple
                accept=".csv,.xlsx"
                onChange={handleFileUpload}
                className="rounded-xl border-2 p-2 border-white cursor-pointer"
            />

            {errors.length > 0 && (
                <div className="bg-red-100 text-red-700 p-2 rounded">
                    <h2 className="font-bold">Errors:</h2>
                    <ul className="list-disc pl-5">
                        {errors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {mappingModalOpen && pendingMapping && (
                <HeaderMappingModal
                    open={mappingModalOpen}
                    mapping={pendingMapping}
                    onClose={() => setMappingModalOpen(false)}
                    onApply={handleMappingApply}
                />
            )}
        </div>
    )
}
