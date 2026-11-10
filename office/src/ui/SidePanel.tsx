import { useEffect, useState, type FormEvent } from 'react'
import type { Agent, AgentSource } from '../types'
import { STATE_LABEL } from '../types'
import { formatCaracas } from './format'

const AREA_LABEL = {
  web: 'Web Dev',
  contenido: 'Contenido / Research',
  personal: 'Personal',
  ceo: 'Coordinación',
} as const

export function SidePanel({
  agent,
  source,
  onClose,
}: {
  agent: Agent
  source: AgentSource
  onClose: () => void
}) {
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    setDraft('')
    setNote(null)
  }, [agent.id])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const task = draft.trim()
    if (!task || sending) return
    setSending(true)
    setNote(null)
    try {
      await source.sendTask(agent.id, task)
      setDraft('')
      setNote('Listo. Va camino a su puesto.')
    } catch (error) {
      setNote(error instanceof Error ? error.message : 'No se pudo enviar.')
    } finally {
      setSending(false)
    }
  }

  return (
    <aside className="panel" role="dialog" aria-label={agent.name}>
      <header className="panel-head">
        <span className="swatch" style={{ background: agent.color }} />
        <div>
          <h2>{agent.name}</h2>
          <p>{agent.role}</p>
          <p className="area">{AREA_LABEL[agent.area]}</p>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
      </header>

      <section>
        <h3>Estado</h3>
        <p className={`chip chip-${agent.state}`}>{STATE_LABEL[agent.state]}</p>
      </section>

      <section>
        <h3>Tarea actual</h3>
        <p className="task">{agent.task || 'Sin tarea ahora mismo.'}</p>
      </section>

      <section>
        <h3>Rutinas</h3>
        {agent.routines.length === 0 ? (
          <p className="muted">Sin rutinas programadas.</p>
        ) : (
          <ul className="routines">
            {agent.routines.map((routine) => (
              <li key={routine.name}>
                <div className="routine-top">
                  <strong>{routine.name}</strong>
                  <span className={routine.active ? 'flag on' : 'flag off'}>
                    {routine.active ? 'Activa' : 'Pausada'}
                  </span>
                </div>
                <em>{routine.schedule} · hora de Caracas</em>
                <p>{routine.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>Actividad reciente</h3>
        {agent.activity.length === 0 ? (
          <p className="muted">Todavía no hay movimiento.</p>
        ) : (
          <ul className="log">
            {agent.activity.map((item, index) => (
              <li key={`${item.at}-${index}`}>
                <time dateTime={item.at}>{formatCaracas(item.at)} Caracas</time>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={onSubmit}>
        <label htmlFor="asignar">Asignar tarea</label>
        <textarea
          id="asignar"
          rows={3}
          maxLength={280}
          value={draft}
          placeholder="Escribe lo que tiene que hacer…"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" disabled={sending || draft.trim() === ''}>
          {sending ? 'Enviando…' : 'Asignar'}
        </button>
        {note && <p className="form-note">{note}</p>}
      </form>
    </aside>
  )
}
