import type { Agent, AgentSource } from '../types'
import { STATE_LABEL } from '../types'

export type OfficeView = 'oficina' | 'equipo' | 'rutinas' | 'config'

const LINKS: { id: OfficeView; label: string }[] = [
  { id: 'oficina', label: 'Inicio' },
  { id: 'equipo', label: 'Equipo' },
  { id: 'rutinas', label: 'Rutinas' },
  { id: 'config', label: 'Configuración' },
]

export function TopBar({
  view,
  onView,
}: {
  view: OfficeView
  onView: (view: OfficeView) => void
}) {
  return (
    <header className="topbar">
      <button type="button" className="brand" onClick={() => onView('oficina')}>
        <span className="brand-mark">DB</span>
        <span>
          Don Bots
          <small>Oficina</small>
        </span>
      </button>
      <nav>
        {LINKS.map((link) => (
          <button
            key={link.id}
            type="button"
            className={view === link.id ? 'nav-link on' : 'nav-link'}
            onClick={() => onView(link.id)}
          >
            {link.label}
          </button>
        ))}
      </nav>
    </header>
  )
}

export function SourceChip({
  kind,
  agents,
}: {
  kind: AgentSource['kind']
  agents: Agent[]
}) {
  const trabajando = agents.filter((agent) => agent.state === 'trabajando').length
  const esperando = agents.filter((agent) => agent.state === 'esperando').length
  const libre = agents.filter((agent) => agent.state === 'libre').length
  return (
    <p className="source-chip">
      <i className="dot" style={{ background: '#22a06b' }} />
      Trabajando {trabajando}
      <i className="dot" style={{ background: '#f5a524' }} />
      Esperando {esperando}
      <i className="dot" style={{ background: '#e36aa2' }} />
      Libre {libre}
      <span>{kind === 'mock' ? 'Simulación' : 'Hermes'}</span>
    </p>
  )
}

export function Overlays({
  view,
  agents,
  onView,
  onSelect,
}: {
  view: OfficeView
  agents: Agent[]
  onView: (view: OfficeView) => void
  onSelect: (id: string) => void
}) {
  if (view === 'oficina') return null
  return (
    <>
      <button type="button" className="scrim" aria-label="Cerrar" onClick={() => onView('oficina')} />
      <section className="sheet" role="dialog" aria-label={titleFor(view)}>
        <header>
          <h2>{titleFor(view)}</h2>
          <button type="button" className="icon-btn" onClick={() => onView('oficina')} aria-label="Cerrar">
            ×
          </button>
        </header>
        {view === 'equipo' && <Team agents={agents} onSelect={onSelect} onView={onView} />}
        {view === 'rutinas' && <Routines agents={agents} />}
        {view === 'config' && <Config />}
      </section>
    </>
  )
}

function titleFor(view: OfficeView): string {
  if (view === 'equipo') return 'Equipo'
  if (view === 'rutinas') return 'Rutinas'
  return 'Configuración'
}

function Team({
  agents,
  onSelect,
  onView,
}: {
  agents: Agent[]
  onSelect: (id: string) => void
  onView: (view: OfficeView) => void
}) {
  return (
    <ul className="team">
      {agents.map((agent) => (
        <li key={agent.id}>
          <button
            type="button"
            onClick={() => {
              onSelect(agent.id)
              onView('oficina')
            }}
          >
            <span className="swatch" style={{ background: agent.color }} />
            <span>
              <strong>{agent.name}</strong>
              <small>{agent.tagRole}</small>
            </span>
            <em className={`chip chip-${agent.state}`}>{STATE_LABEL[agent.state]}</em>
          </button>
        </li>
      ))}
    </ul>
  )
}

function Routines({ agents }: { agents: Agent[] }) {
  const withRoutines = agents.filter((agent) => agent.routines.length > 0)
  const without = agents.filter((agent) => agent.routines.length === 0)
  return (
    <div className="routine-sheet">
      {withRoutines.map((agent) => (
        <article key={agent.id}>
          <h3>{agent.name}</h3>
          <ul>
            {agent.routines.map((routine) => (
              <li key={routine.name}>
                <strong>{routine.name}</strong>
                <span>{routine.active ? 'Activa' : 'Pausada'}</span>
                <em>{routine.schedule} · Caracas</em>
                <p>{routine.summary}</p>
              </li>
            ))}
          </ul>
        </article>
      ))}
      <p className="muted">Sin rutinas: {without.map((agent) => agent.tag).join(', ')}.</p>
    </div>
  )
}

function Config() {
  const mode = (import.meta.env.VITE_AGENT_SOURCE ?? 'mock').toLowerCase()
  return (
    <div className="config">
      <p>
        Fuente actual: <strong>{mode === 'hermes' ? 'Hermes' : 'simulación'}</strong>.
      </p>
      <p>
        La simulación cambia el estado de alguien cada pocos segundos para que se vea el
        recorrido. Asignar una tarea lo manda de vuelta a su puesto. Nada sale de esta
        pestaña.
      </p>
      <p>
        Para el VPS, <code>VITE_AGENT_SOURCE=hermes</code> y <code>VITE_HERMES_BASE_URL</code>.
        El adaptador y lo que falta confirmar están en <code>office/docs/HERMES.md</code>.
      </p>
    </div>
  )
}
