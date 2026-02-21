export function extractCssVariables(css: string): Record<string, string> {
  const vars: Record<string, string> = {}
  const CSS_VAR_REGEX = /--([\w-]+)\s*:\s*([^;}{]+)/gi

  let match
  while ((match = CSS_VAR_REGEX.exec(css)) !== null) {
    const key = `--${match[1].trim()}`
    const value = match[2].trim()

    // Filtrar variables que referencian otras variables (no resueltas)
    if (value.includes('var(--')) continue
    // Filtrar valores vacíos o muy largos (ruido)
    if (!value || value.length > 100) continue
    // Filtrar variables internas de librerías (Radix, etc.)
    if (key.includes('radix') || key.includes('tw-') || key.includes('_')) continue

    vars[key] = value
  }

  return vars
}
export function groupCssVariables(vars: Record<string, string>) {
  const groups: Record<string, Record<string, string>> = {
    colors: {},
    typography: {},
    spacing: {},
    radius: {},
    shadow: {},
    other: {},
  }

  for (const [key, value] of Object.entries(vars)) {
    if (isColorValue(value)) {
      groups.colors[key] = value
    } else if (key.match(/font|text|size|weight|line|letter/i)) {
      groups.typography[key] = value
    } else if (key.match(/space|gap|pad|margin|indent/i)) {
      groups.spacing[key] = value
    } else if (key.match(/radius|round/i)) {
      groups.radius[key] = value
    } else if (key.match(/shadow|elevation/i)) {
      groups.shadow[key] = value
    } else {
      groups.other[key] = value
    }
  }

  return Object.fromEntries(
    Object.entries(groups).filter(([, v]) => Object.keys(v).length > 0)
  )
}

function isColorValue(value: string): boolean {
  return /^(#[0-9a-fA-F]{3,8}|rgb|rgba|hsl|hsla)/i.test(value)
}

export function extractTokens(css: string) {
  return {
    spacing: dedupeValues(css, /(?:padding|margin|gap|top|left|right|bottom)\s*:\s*([^;}{]+)/gi),
    borderRadius: dedupeValues(css, /border-radius\s*:\s*([^;}{]+)/gi),
    shadows: dedupeValues(css, /box-shadow\s*:\s*([^;}{]+)/gi),
    opacity: dedupeValues(css, /opacity\s*:\s*([\d.]+)/gi),
    borders: dedupeValues(css, /border(?:-width)?\s*:\s*([^;}{]+)/gi),
  }
}

export function extractBreakpoints(css: string): string[] {
  const bps = new Set<string>()
  const regex = /@media[^{]*\((?:min|max)-width\s*:\s*([\d.]+(?:px|em|rem))\)/gi
  let match
  while ((match = regex.exec(css)) !== null) {
    bps.add(match[1].trim())
  }
  return Array.from(bps).sort()
}

function dedupeValues(css: string, regex: RegExp): string[] {
  const values = new Set<string>()
  let match
  while ((match = regex.exec(css)) !== null) {
    const val = match[1].trim()
    if (val && val !== 'none' && val !== 'inherit') values.add(val)
  }
  return Array.from(values)
}