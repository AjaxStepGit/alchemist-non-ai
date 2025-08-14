export const normalize = (s: string) =>
    (s || '')
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '')
