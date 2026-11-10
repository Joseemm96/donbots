export type AgentState = 'trabajando' | 'esperando' | 'libre'

export type AreaId = 'web' | 'contenido' | 'personal' | 'ceo'

export interface Routine {
  name: string
  schedule: string
  summary: string
  active: boolean
}

export interface ActivityEntry {
  at: string
  text: string
}

/** Ficha estática, armada a partir de bots/<id>/HANDOFF.md. Sin secretos. */
export interface BotProfile {
  id: string
  name: string
  tag: string
  role: string
  tagRole: string
  area: AreaId
  color: string
  skin: string
  accent?: string
  routines: Routine[]
}

/** Lo que la oficina pinta y lo que una fuente devuelve. */
export interface Agent extends BotProfile {
  state: AgentState
  task: string
  activity: ActivityEntry[]
}

export const STATE_LABEL: Record<AgentState, string> = {
  trabajando: 'Trabajando',
  esperando: 'Esperando tu OK',
  libre: 'Libre',
}

/**
 * Adaptador de datos. MockSource simula. HermesSource es un stub
 * hacia un puente en el VPS (ver docs/HERMES.md). La UI solo habla con esto.
 */
export interface AgentSource {
  readonly kind: 'mock' | 'hermes'
  list(): Promise<Agent[]>
  /** Devuelve una función para dejar de escuchar. */
  subscribe(listener: (agents: Agent[]) => void): () => void
  sendTask(agentId: string, task: string): Promise<void>
}
