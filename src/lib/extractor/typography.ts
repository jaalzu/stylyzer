import { TypographyToken } from '@/types/analysis'

const FONT_FAMILY_REGEX = /font-family\s*:\s*([^;}{,]+?)(?:\s*[;}{]|,(?=[^(]))/gi
const FONT_SIZE_REGEX = /font-size\s*:\s*([^;}{]+?)(?:\s*[;}{])/gi
const FONT_WEIGHT_REGEX = /font-weight\s*:\s*(\d{3}|bold|normal|lighter|bolder)/gi
const LINE_HEIGHT_REGEX = /line-height\s*:\s*([^;}{]+)/gi
const LETTER_SPACING_REGEX = /letter-spacing\s*:\s*([^;}{]+)/gi
const GOOGLE_FONTS_REGEX = /fonts\.googleapis\.com\/css[^"')]+/gi

export function extractTypography(css: string, html: string) {
  const fontFamilies = extractMatches(css, FONT_FAMILY_REGEX)
  const sizes = dedupe(extractMatches(css, FONT_SIZE_REGEX))
  const weights = dedupe(extractMatches(css, FONT_WEIGHT_REGEX))
    .map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b)
  const lineHeights = dedupe(extractMatches(css, LINE_HEIGHT_REGEX))
  const letterSpacings = dedupe(extractMatches(css, LETTER_SPACING_REGEX))

  // Google Fonts detectados
  const googleFonts = html.match(GOOGLE_FONTS_REGEX) || []

  const fontMap = new Map<string, Set<number>>()
  for (const family of fontFamilies) {
    const clean = family.replace(/['"]/g, '').split(',')[0].trim()
    if (!clean || clean === 'inherit' || clean === 'initial') continue
    if (!fontMap.has(clean)) fontMap.set(clean, new Set())
  }

  const fonts: TypographyToken[] = Array.from(fontMap.entries()).map(([fontFamily]) => ({
    fontFamily,
    weights,
    sizes,
    isExternal: googleFonts.some(g => g.toLowerCase().includes(fontFamily.toLowerCase())),
    source: googleFonts.length ? 'google-fonts' : undefined,
  }))

  return { fonts, sizes, weights, lineHeights, letterSpacings }
}

function extractMatches(css: string, regex: RegExp): string[] {
  const results: string[] = []
  let match
  while ((match = regex.exec(css)) !== null) {
    results.push(match[1].trim())
  }
  return results
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)]
}