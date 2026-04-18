export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
}

export function nanoid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
