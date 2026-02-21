import { AssetToken } from '@/lib/extractor/assets'
import { LayoutTokens } from '@/lib/extractor/layout'


export interface ColorToken {
  value: string
  format: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla'
  count: number
  isGradient?: boolean
}

export interface TypographyToken {
  fontFamily: string
  weights: number[]
  sizes: string[]
  isExternal: boolean
  source?: string // google fonts, etc
}

export interface AnalysisResult {
  url: string
  title: string
  favicon?: string
  colors: {
    all: ColorToken[]
    dominant: ColorToken[]
    gradients: string[]
    semantic: Record<string, string> // primary, secondary, etc
  }
  typography: {
    fonts: TypographyToken[]
    sizes: string[]
    weights: number[]
    lineHeights: string[]
    letterSpacings: string[]
  }
  tokens: {
    spacing: string[]
    borderRadius: string[]
    shadows: string[]
    opacity: string[]
    borders: string[]
  }
    layout: LayoutTokens,     // ← esto faltaba
    assets: AssetToken[]       // ← agregado
  breakpoints: string[]
cssVariables: {
  raw: Record<string, string>
  grouped: Record<string, Record<string, string>>
},
  analyzedAt: string
}