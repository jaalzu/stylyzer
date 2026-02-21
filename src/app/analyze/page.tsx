'use client'
import { useEffect, useState } from 'react'
import { AnalysisResult } from '@/types/analysis'

export default function AnalyzePage() {
  const [data, setData] = useState<AnalysisResult | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('analysis')
    if (stored) setData(JSON.parse(stored))
  }, [])

  if (!data) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
      Sin datos
    </div>
  )

const colorVars = Object.entries(data.cssVariables.grouped.colors || {})
const otherVars = Object.entries(data.cssVariables.grouped).filter(([k]) => k !== 'colors').flatMap(([, v]) => Object.entries(v))

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-1">{data.title}</h1>
      <p className="text-zinc-400 text-sm mb-8">{data.url}</p>

      {/* Colores */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Colores ({data.colors.all.length})</h2>
        <div className="flex flex-wrap gap-2">
          {data.colors.dominant.map((c, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-12 h-12 rounded-lg border border-zinc-700 cursor-pointer"
                style={{ backgroundColor: c.value }}
                onClick={() => navigator.clipboard.writeText(c.value)}
                title={c.value}
              />
              <span className="text-xs text-zinc-400">{c.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tipografía */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Tipografías</h2>
        <div className="flex flex-wrap gap-3">
          {data.typography.fonts.map((f, i) => (
            <div key={i} className="px-4 py-2 bg-zinc-800 rounded-lg">
              <p className="font-medium" style={{ fontFamily: f.fontFamily }}>{f.fontFamily}</p>
              {f.isExternal && <span className="text-xs text-zinc-500">Google Fonts</span>}
            </div>
          ))}
        </div>
      </section>

      {data.layout && (
  <section className="mb-10">
    <h2 className="text-lg font-semibold mb-4">Layout</h2>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {data.layout.maxWidths.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 uppercase mb-2">Max Widths</p>
          <div className="flex flex-col gap-1">
            {data.layout.maxWidths.map((v, i) => (
              <span key={i} className="px-3 py-1 bg-zinc-800 rounded text-sm font-mono text-zinc-300">{v}</span>
            ))}
          </div>
        </div>
      )}
      {data.layout.gaps.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 uppercase mb-2">Gaps</p>
          <div className="flex flex-col gap-1">
            {data.layout.gaps.map((v, i) => (
              <span key={i} className="px-3 py-1 bg-zinc-800 rounded text-sm font-mono text-zinc-300">{v}</span>
            ))}
          </div>
        </div>
      )}
      {data.layout.zIndexes.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 uppercase mb-2">Z-Index</p>
          <div className="flex flex-col gap-1">
            {data.layout.zIndexes.map((v, i) => (
              <span key={i} className="px-3 py-1 bg-zinc-800 rounded text-sm font-mono text-zinc-300">{v}</span>
            ))}
          </div>
        </div>
      )}
      {data.layout.gridTemplates.length > 0 && (
        <div className="col-span-2 md:col-span-3">
          <p className="text-xs text-zinc-500 uppercase mb-2">Grid Templates</p>
          <div className="flex flex-col gap-1">
            {data.layout.gridTemplates.map((v, i) => (
              <span key={i} className="px-3 py-1 bg-zinc-800 rounded text-sm font-mono text-zinc-300">{v}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  </section>
)}

      {/* CSS Variables */}
      {Object.keys(data.cssVariables.raw).length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">CSS Variables</h2>

          {colorVars.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-zinc-500 uppercase mb-2">Colores</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {colorVars.map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3 px-3 py-2 bg-zinc-800 rounded text-sm font-mono">
                    <div className="w-5 h-5 rounded shrink-0 border border-zinc-600" style={{ backgroundColor: v }} />
                    <span className="text-purple-400 truncate">{k}</span>
                    <span className="text-zinc-400 ml-auto">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherVars.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase mb-2">Otros</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {otherVars.slice(0, 20).map(([k, v]) => (
                  <div key={k} className="flex justify-between px-3 py-2 bg-zinc-800 rounded text-sm font-mono">
                    <span className="text-purple-400">{k}</span>
                    <span className="text-zinc-400">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
      {data.assets.length > 0 && (
  <section className="mb-10">
    <h2 className="text-lg font-semibold mb-4">Assets ({data.assets.length})</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {data.assets.filter(a => a.type === 'image' || a.type === 'logo').map((a, i) => (
        <div key={i} className="bg-zinc-800 rounded-lg overflow-hidden">
          <img
            src={a.src}
            alt={a.alt || ''}
            className="w-full h-24 object-cover"
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          {a.type === 'logo' && (
            <p className="text-xs text-zinc-500 px-2 py-1">Logo</p>
          )}
        </div>
      ))}
    </div>

    {data.assets.some(a => a.type === 'og-image') && (
      <div className="mt-4">
        <p className="text-xs text-zinc-500 uppercase mb-2">OG Image</p>
        <img
          src={data.assets.find(a => a.type === 'og-image')!.src}
          alt="OG Image"
          className="rounded-lg max-h-48 object-cover"
          onError={e => (e.currentTarget.style.display = 'none')}
        />
      </div>
    )}
  </section>
)}

      {/* Breakpoints */}
      {data.breakpoints.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Breakpoints</h2>
          <div className="flex gap-2 flex-wrap">
            {data.breakpoints.map((bp, i) => (
              <span key={i} className="px-3 py-1 bg-zinc-800 rounded text-sm font-mono text-zinc-300">{bp}</span>
            ))}
          </div>
        </section>
        
      )}
    </main>
  )
}