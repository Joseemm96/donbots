import type { Agent, AgentSource } from '../types'

/**
 * Stub. No habla con Hermes directo.
 *
 * Grok Bot no expone el estado de los bots, y al armar este prototipo
 * no había una API de Hermes verificada a la que pegarse. Lo de abajo
 * es el contrato de un puente chico que viviría en el VPS de Vessel
 * (SSE + POST). Las rutas son una propuesta nuestra, no de Hermes.
 * Hay que confirmarlas al instalarlo. Ver docs/HERMES.md.
 */
const AGENTS_PATH = '/api/agents' // TODO: confirmar en el puente, no es una ruta de Hermes
const EVENTS_PATH = '/api/events' // TODO: confirmar. Se asume SSE con { agents: Agent[] }
const TASKS_PATH = '/tasks' // TODO: confirmar. POST { task } bajo /api/agents/:id

export class HermesSource implements AgentSource {
  readonly kind = 'hermes' as const
  private baseUrl: string

  constructor(baseUrl = import.meta.env.VITE_HERMES_BASE_URL ?? '') {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  async list(): Promise<Agent[]> {
    const body = await this.request('GET', AGENTS_PATH)
    return readAgents(body)
  }

  subscribe(listener: (agents: Agent[]) => void): () => void {
    if (!this.baseUrl || typeof EventSource === 'undefined') return () => {}
    // EventSource no manda headers de auth. Si el puente exige una clave,
    // hay que resolverlo en el mismo origen (cookie) o cambiar a WebSocket.
    const source = new EventSource(`${this.baseUrl}${EVENTS_PATH}`)
    source.onmessage = (event) => {
      try {
        listener(readAgents(JSON.parse(event.data)))
      } catch {
        // Un evento mal formado no tira la oficina. El puente se ajusta después.
      }
    }
    return () => source.close()
  }

  async sendTask(agentId: string, task: string): Promise<void> {
    const text = task.trim()
    if (!text) throw new Error('La tarea está vacía.')
    await this.request(
      'POST',
      `${AGENTS_PATH}/${encodeURIComponent(agentId)}${TASKS_PATH}`,
      { task: text.slice(0, 280) },
    )
  }

  private async request(method: 'GET' | 'POST', path: string, body?: unknown): Promise<unknown> {
    if (!this.baseUrl) {
      throw new Error(
        'Falta VITE_HERMES_BASE_URL. El stub no inventa un servidor. Mira office/docs/HERMES.md.',
      )
    }
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: body ? { 'content-type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch {
      throw new Error(
        'No se pudo llegar al puente Hermes. Revisa la URL y que el VPS esté en la tailnet.',
      )
    }
    if (!response.ok) {
      throw new Error(`El puente respondió ${response.status} en ${path}.`)
    }
    if (response.status === 204) return null
    return response.json()
  }
}

function readAgents(body: unknown): Agent[] {
  const agents = Array.isArray(body)
    ? body
    : body && typeof body === 'object' && Array.isArray((body as { agents?: unknown }).agents)
      ? (body as { agents: unknown[] }).agents
      : null
  if (!agents) {
    throw new Error('El puente no devolvió una lista de agentes. Forma esperada: { agents: [...] }.')
  }
  return agents as Agent[]
}
