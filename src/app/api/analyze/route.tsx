import { NextRequest, NextResponse } from 'next/server'
import { extractColors, inferSemanticColors } from '@/lib/extractor/colors'
import { extractTypography } from '@/lib/extractor/typography'
import { extractTokens, extractCssVariables, groupCssVariables, extractBreakpoints } from '@/lib/extractor/tokens'
import { extractLayout } from '@/lib/extractor/layout'
import { extractAssets } from '@/lib/extractor/assets'
import { AnalysisResult } from '@/types/analysis'

const BLOCKED = ['localhost', '127.0.0.1', '0.0.0.0', '::1']
const MAX_STYLESHEETS = 10
const TIMEOUT_MS = 10000

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  if (!url) return NextResponse.json({ error: 'URL requerida' }, { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
  }

  if (BLOCKED.some(b => parsed.hostname.includes(b))) {
    return NextResponse.json({ error: 'URL no permitida' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const htmlRes = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Stylyzer/1.0)' },
    })
    clearTimeout(timeout)

    const html = await htmlRes.text()

    const cssLinks = extractCssLinks(html, parsed.origin)
    const cssSheets = await Promise.allSettled(
      cssLinks.slice(0, MAX_STYLESHEETS).map(href =>
        fetch(href, { signal: AbortSignal.timeout(5000) }).then(r => r.text())
      )
    )

    const inlineCSS = extractInlineCSS(html)
    const allCSS = [
      inlineCSS,
      ...cssSheets
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map(r => r.value),
    ].join('\n')

    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || parsed.hostname
    const favicon = `${parsed.origin}/favicon.ico`

    const { all, dominant, gradients } = extractColors(allCSS)
    const colors = { all, dominant, gradients, semantic: inferSemanticColors(all) }
    const typography = extractTypography(allCSS, html)
    const tokens = extractTokens(allCSS)
    const rawVars = extractCssVariables(allCSS)
    const cssVariables = {
      raw: rawVars,
      grouped: groupCssVariables(rawVars),
    }
    const breakpoints = extractBreakpoints(allCSS)
    const layout = extractLayout(allCSS)
    const assets = extractAssets(html, parsed.origin)

    const result: AnalysisResult = {
      url, title, favicon,
      colors, typography, tokens,
      cssVariables, layout, assets,
      breakpoints,
      analyzedAt: new Date().toISOString(),
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Timeout: el sitio tardó demasiado' }, { status: 408 })
    }
    return NextResponse.json({ error: 'No se pudo analizar el sitio' }, { status: 500 })
  }
}

function extractCssLinks(html: string, origin: string): string[] {
  const links: string[] = []
  const regex = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    const href = match[1]
    try {
      links.push(href.startsWith('http') ? href : new URL(href, origin).toString())
    } catch {}
  }
  return links
}

function extractInlineCSS(html: string): string {
  const chunks: string[] = []
  const regex = /<style[^>]*>([\s\S]*?)<\/style>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    chunks.push(match[1])
  }
  return chunks.join('\n')
}