import { ColorToken } from '@/types/analysis'

const COLOR_REGEX = /(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\))/g
const GRADIENT_REGEX = /(linear-gradient|radial-gradient|conic-gradient)\([^;{}]+\)/g
const NAMED_COLORS = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'gray', 'grey', 'transparent']

export function extractColors(css: string): {
  all: ColorToken[]
  dominant: ColorToken[]
  gradients: string[]
} {
  const colorMap = new Map<string, number>()
  const gradients: string[] = []
  
const namedMatches = css.match(/(?:color|background|fill|stroke)\s*:\s*(black|white|red|blue|green|yellow|orange|purple|pink|gray|grey)/gi) || []
for (const match of namedMatches) {
  const color = match.split(':')[1].trim().toLowerCase()
  if (!NAMED_COLORS.includes(color) || color === 'transparent') continue
  colorMap.set(color, (colorMap.get(color) || 0) + 1)
}
  const gradientMatches = css.match(GRADIENT_REGEX) || []
  gradients.push(...new Set(gradientMatches))

  const matches = css.match(COLOR_REGEX) || []
  for (const color of matches) {
    const normalized = normalizeColor(color)
    if (!normalized) continue
    colorMap.set(normalized, (colorMap.get(normalized) || 0) + 1)
  }

  const all: ColorToken[] = Array.from(colorMap.entries())
    .filter(([value]) => !isNearlyTransparent(value))
    .filter(([value]) => !isNoise(value))
    .map(([value, count]) => ({
      value,
      format: detectFormat(value),
      count,
    }))
    .sort((a, b) => b.count - a.count)

  const deduped = deduplicateSimilar(all)
  const dominant = deduped.slice(0, 12)

  return { all: deduped, dominant, gradients }
}

export function inferSemanticColors(colors: ColorToken[]): Record<string, string> {
  const semantic: Record<string, string> = {}
  const nonNeutral = colors.filter(c => !isNeutral(c.value))

  if (nonNeutral[0]) semantic.primary = nonNeutral[0].value
  if (nonNeutral[1]) semantic.secondary = nonNeutral[1].value

  for (const color of colors) {
    const rgb = hexToRgb(color.value)
    if (!rgb) continue

    const { r, g, b } = rgb
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min
    if (delta === 0) continue

    let h = 0
    if (max === r) h = ((g - b) / delta) % 6
    else if (max === g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4
    h = Math.round(h * 60)
    if (h < 0) h += 360

    const s = max === 0 ? 0 : delta / max

    if (!semantic.error && (h <= 20 || h >= 340) && s > 0.5) semantic.error = color.value
    if (!semantic.success && h >= 100 && h <= 160 && s > 0.4) semantic.success = color.value
    if (!semantic.warning && h >= 30 && h <= 65 && s > 0.5) semantic.warning = color.value
    if (!semantic.info && h >= 195 && h <= 240 && s > 0.4) semantic.info = color.value
  }

  return semantic
}

function normalizeColor(color: string): string | null {
  const c = color.trim().toLowerCase()
  if (c.startsWith('rgba')) {
    const parts = c.match(/[\d.]+/g)
    if (parts && parts[3] !== undefined) {
      const alpha = parseFloat(parts[3])
      if (alpha < 0.1) return null
    }
  }
  return c
}

function isNearlyTransparent(color: string): boolean {
  if (!color.startsWith('rgba')) return false
  const parts = color.match(/[\d.]+/g)
  if (!parts || parts[3] === undefined) return false
  return parseFloat(parts[3]) < 0.1
}

function isNoise(color: string): boolean {
  const noiseValues = ['transparent', 'currentcolor', 'inherit', 'initial', 'unset']
  return noiseValues.includes(color.toLowerCase())
}

function isNeutral(color: string): boolean {
  const rgb = hexToRgb(color)
  if (!rgb) return false
  const { r, g, b } = rgb
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const s = max === 0 ? 0 : delta / max
  return s < 0.15
}

function deduplicateSimilar(colors: ColorToken[]): ColorToken[] {
  const result: ColorToken[] = []
  for (const color of colors) {
    const rgb = hexToRgb(color.value)
    if (!rgb) { result.push(color); continue }
    const isDuplicate = result.some(existing => {
      const existingRgb = hexToRgb(existing.value)
      if (!existingRgb) return false
      return (
        Math.abs(rgb.r - existingRgb.r) < 15 &&
        Math.abs(rgb.g - existingRgb.g) < 15 &&
        Math.abs(rgb.b - existingRgb.b) < 15
      )
    })
    if (!isDuplicate) result.push(color)
  }
  return result
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 3 && clean.length !== 6) return null
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

function detectFormat(color: string): ColorToken['format'] {
  if (color.startsWith('#')) return 'hex'
  if (color.startsWith('rgba')) return 'rgba'
  if (color.startsWith('rgb')) return 'rgb'
  if (color.startsWith('hsla')) return 'hsla'
  return 'hsl'
}