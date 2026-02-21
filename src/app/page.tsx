'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnalysisResult } from '@/types/analysis'

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const analyze = async () => {
    if (!url) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data: AnalysisResult = await res.json()
      if (!res.ok) throw new Error((data as any).error)
      // Guardamos en sessionStorage para pasarlo al dashboard
      sessionStorage.setItem('analysis', JSON.stringify(data))
      router.push('/analyze')
    } catch (e: any) {
      setError(e.message || 'Algo salió mal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950">
      <h1 className="text-4xl font-bold text-white mb-2">Stylyzer</h1>
      <p className="text-zinc-400 mb-8">Extraé el sistema de diseño de cualquier sitio web</p>

      <div className="flex gap-2 w-full max-w-xl">
        <input
          type="url"
          placeholder="https://ejemplo.com"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && analyze()}
          className="flex-1 px-4 py-3 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:border-zinc-500"
        />
        <button
          onClick={analyze}
          disabled={loading}
          className="px-6 py-3 bg-white text-black font-semibold rounded-lg disabled:opacity-50 hover:bg-zinc-200 transition-colors"
        >
          {loading ? 'Analizando...' : 'Analizar'}
        </button>
      </div>

      {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
    </main>
  )
}