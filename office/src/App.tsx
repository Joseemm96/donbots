import { Component, useEffect, useState, type ReactNode } from 'react'
import { OfficeScene } from './office/OfficeScene'
import { getSource } from './sources'
import type { Agent } from './types'
import { Overlays, SourceChip, TopBar, type OfficeView } from './ui/Chrome'
import { SidePanel } from './ui/SidePanel'

const source = getSource()

export function App() {
  const [agents, setAgents] = useState<Agent[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<OfficeView>('oficina')

  useEffect(() => {
    let stop = () => {}
    let alive = true
    source
      .list()
      .then((list) => {
        if (!alive) return
        setAgents(list)
        stop = source.subscribe(setAgents)
      })
      .catch((reason: unknown) => {
        if (!alive) return
        setError(reason instanceof Error ? reason.message : 'No se pudo abrir la oficina.')
      })
    return () => {
      alive = false
      stop()
    }
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setSelectedId(null)
      setView('oficina')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (error) {
    return (
      <main className="boot-error">
        <div>
          <h1>La oficina no conectó</h1>
          <p>{error}</p>
        </div>
      </main>
    )
  }

  if (!agents) {
    return (
      <main className="boot">
        <p>Abriendo la oficina…</p>
      </main>
    )
  }

  const selected = agents.find((agent) => agent.id === selectedId) ?? null

  return (
    <WebGLBoundary>
      <main className="stage">
        <OfficeScene agents={agents} selectedId={selectedId} onSelect={setSelectedId} />
        <TopBar
          view={view}
          onView={(next) => {
            setView(next)
            if (next !== 'oficina') setSelectedId(null)
          }}
        />
        <SourceChip kind={source.kind} agents={agents} />
        <Overlays
          view={view}
          agents={agents}
          onView={setView}
          onSelect={setSelectedId}
        />
        {selected && view === 'oficina' && (
          <SidePanel agent={selected} source={source} onClose={() => setSelectedId(null)} />
        )}
      </main>
    </WebGLBoundary>
  )
}

class WebGLBoundary extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null }

  static getDerivedStateFromError(error: Error) {
    return { message: error.message }
  }

  render() {
    if (this.state.message) {
      return (
        <main className="boot-error">
          <div>
            <h1>Tu navegador no pudo abrir la oficina 3D</h1>
            <p>{this.state.message}</p>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}
