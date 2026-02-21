export interface LayoutTokens {
  maxWidths: string[]
  paddings: string[]
  margins: string[]
  gaps: string[]
  zIndexes: string[]
  displays: string[]
  gridTemplates: string[]
}

const MAX_WIDTH_REGEX = /max-width\s*:\s*([^;}{]+)/gi
const PADDING_REGEX = /(?<![a-z-])padding\s*:\s*([^;}{]+)/gi
const MARGIN_REGEX = /(?<![a-z-])margin\s*:\s*([^;}{]+)/gi
const GAP_REGEX = /(?<![a-z-])gap\s*:\s*([^;}{]+)/gi
const Z_INDEX_REGEX = /z-index\s*:\s*([^;}{]+)/gi
const DISPLAY_REGEX = /display\s*:\s*(flex|grid|inline-flex|inline-grid|block|inline-block)/gi
const GRID_TEMPLATE_REGEX = /grid-template-columns\s*:\s*([^;}{]+)/gi

export function extractLayout(css: string): LayoutTokens {
  return {
    maxWidths: dedupeAndSort(extractAll(css, MAX_WIDTH_REGEX)),
    paddings: dedupeAndSort(extractAll(css, PADDING_REGEX)),
    margins: dedupeAndSort(extractAll(css, MARGIN_REGEX)),
    gaps: dedupeAndSort(extractAll(css, GAP_REGEX)),
    zIndexes: dedupeAndSort(extractAll(css, Z_INDEX_REGEX)),
    displays: dedupe(extractAll(css, DISPLAY_REGEX)),
    gridTemplates: dedupe(extractAll(css, GRID_TEMPLATE_REGEX)),
  }
}

function extractAll(css: string, regex: RegExp): string[] {
  const results: string[] = []
  let match
  while ((match = regex.exec(css)) !== null) {
    const val = match[1].trim()
    if (val && val !== 'none' && val !== 'inherit' && val !== 'auto') {
      results.push(val)
    }
  }
  return results
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)]
}

function dedupeAndSort(arr: string[]): string[] {
  return [...new Set(arr)].sort((a, b) => {
    const numA = parseFloat(a)
    const numB = parseFloat(b)
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB
    return a.localeCompare(b)
  })
}