export interface AssetToken {
  type: 'image' | 'svg' | 'favicon' | 'og-image' | 'logo'
  src: string
  alt?: string
}

export function extractAssets(html: string, origin: string): AssetToken[] {
  const assets: AssetToken[] = []

  // OG image
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
  if (og) assets.push({ type: 'og-image', src: og })

  // Favicon
  const favicon = html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i)?.[1]
  if (favicon) assets.push({ type: 'favicon', src: resolveUrl(favicon, origin) })

  // Imágenes
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi
  let match
  while ((match = imgRegex.exec(html)) !== null) {
    const src = resolveUrl(match[1], origin)
    const alt = match[2] || ''
    const isLogo = /logo/i.test(src) || /logo/i.test(alt)
    assets.push({ type: isLogo ? 'logo' : 'image', src, alt })
  }

  return assets.slice(0, 50) // cap
}

function resolveUrl(src: string, origin: string): string {
  try {
    return src.startsWith('http') ? src : new URL(src, origin).toString()
  } catch {
    return src
  }
}