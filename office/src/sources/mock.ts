import profiles from '../data/bots.json'
import type { ActivityEntry, Agent, AgentSource, AgentState, BotProfile } from '../types'

const catalog = profiles as BotProfile[]

const START: Record<string, { state: AgentState; task: string }> = {
  'don-bot': {
    state: 'trabajando',
    task: 'Vigilar ofertas de VPN y avisar solo si hay una baja nueva.',
  },
  'don-web-architect': {
    state: 'trabajando',
    task: 'Armar el plan de un cambio de schema. No toca producción.',
  },
  'don-wordpress-implementer': {
    state: 'trabajando',
    task: 'Mantenimiento mensual: plugins, prueba rápida y entrada en el changelog.',
  },
  'don-web-qa': {
    state: 'esperando',
    task: 'Reporte de QA listo. Falta tu OK para pasarlo.',
  },
  'don-seo-specialist': {
    state: 'trabajando',
    task: 'Auditoría técnica: priorizar hallazgos High, Medium y Low.',
  },
  'don-project-manager': {
    state: 'trabajando',
    task: 'Ordenar la carga: Now, Next, Later y bloqueos.',
  },
  'don-viaje': {
    state: 'esperando',
    task: 'Comparativo de posadas listo. Espera tu OK antes de escribirle a nadie.',
  },
  'don-maracucho': {
    state: 'libre',
    task: 'Día libre. El recolector de eventos corre en la noche.',
  },
  'don-finanzas': {
    state: 'trabajando',
    task: 'Cuadrar una hoja de comisiones con el monto bruto.',
  },
  'don-video': {
    state: 'libre',
    task: 'Día libre. Sin clips en la cola.',
  },
  'don-researcher': {
    state: 'trabajando',
    task: 'Resumir novedades de AI con enlace a cada fuente.',
  },
  'don-lcl3': {
    state: 'libre',
    task: 'Sin asignación. Está en la sala hasta que le definan un rol.',
  },
}

const NEXT_TASK: Record<string, string[]> = {
  'don-bot': [
    'Revisar que WhatsApp Web siga abierto, sin entrar a chats.',
    'Repartir un pedido: plan, implementación y QA.',
    'Comparar precios oficiales de VPN contra lo ya alertado.',
  ],
  'don-web-architect': [
    'Dejar un plan corto para un formulario nuevo, sin tocar producción.',
    'Comparar dos formas de resolver el cambio y quedarse con la simple.',
  ],
  'don-wordpress-implementer': [
    'Actualizar plugins, verificar páginas clave y anotar el changelog.',
    'Preparar backup y rollback antes de un cambio en vivo.',
  ],
  'don-web-qa': [
    'Probar el flujo en escritorio y en el teléfono.',
    'Cerrar el pase con severidad, pasos y PASS o FAIL.',
  ],
  'don-seo-specialist': [
    'Revisar titles, canonicals y enlaces rotos de un crawl.',
    'Pasar los fixes al implementador, en orden High primero.',
  ],
  'don-project-manager': [
    'Resumir vencidas y bloqueos, sin cambiar ClickUp todavía.',
    'Preparar el texto del cambio para que Vessel lo apruebe.',
  ],
  'don-viaje': [
    'Buscar posadas y armar la tabla comparativa.',
    'Dejar el borrador del mensaje. No se envía sin aprobación.',
  ],
  'don-maracucho': [
    'Anotar eventos nuevos sin repetir los que ya salieron.',
    'Armar el newsletter: eventos, entradas, promos y un dato extra.',
  ],
  'don-finanzas': [
    'Cargar los montos y confirmar que la hoja cuadra.',
    'Pasar un gasto en bolívares a dólares con la tasa del día.',
  ],
  'don-video': [
    'Transcribir y cortar un clip con subtítulos karaoke.',
    'Quemar subtítulos CC en una entrevista horizontal.',
  ],
  'don-researcher': [
    'Digest del día: viñetas en español, cada una con su enlace.',
    'Verificar un rumor y marcar lo que no está confirmado.',
  ],
  'don-lcl3': [
    'Seguir sin rol hasta que Vessel diga en qué trabaja.',
  ],
}

function hash(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return Math.abs(h)
}

function pick<T>(items: T[], salt: number): T {
  return items[salt % items.length]
}

function entry(minutesAgo: number, text: string): ActivityEntry {
  return { at: new Date(Date.now() - minutesAgo * 60_000).toISOString(), text }
}

function seed(profile: BotProfile): Agent {
  const start = START[profile.id] ?? { state: 'libre' as const, task: 'Sin tarea.' }
  const offset = hash(profile.id) % 18
  const activity =
    start.state === 'libre'
      ? [
          entry(50 + offset, 'Entró a la oficina y no tenía nada en cola.'),
          entry(8 + (offset % 5), 'Se fue a la sala Libre.'),
        ]
      : start.state === 'esperando'
        ? [
            entry(36 + offset, `Trabajó en: ${start.task}`),
            entry(6 + (offset % 4), 'Lo dejó listo y espera tu OK.'),
          ]
        : [
            entry(28 + offset, 'Llegó a su puesto.'),
            entry(4 + (offset % 6), start.task),
          ]
  return { ...profile, state: start.state, task: start.task, activity }
}

const MAX_LIBRE = 4
const MAX_ESPERANDO = 3

/**
 * Simula el piso: cada pocos segundos un bot cambia de estado
 * y la escena lo manda a caminar. Sirve para ver la oficina viva
 * mientras no haya puente con Hermes.
 */
export class MockSource implements AgentSource {
  readonly kind = 'mock' as const
  private agents: Agent[]
  private listeners = new Set<(agents: Agent[]) => void>()

  constructor() {
    this.agents = catalog.map(seed)
    this.schedule()
  }

  async list(): Promise<Agent[]> {
    return this.agents.map(clone)
  }

  subscribe(listener: (agents: Agent[]) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async sendTask(agentId: string, task: string): Promise<void> {
    const text = task.trim()
    if (!text) throw new Error('La tarea está vacía.')
    const agent = this.agents.find((item) => item.id === agentId)
    if (!agent) throw new Error('No está en la oficina.')
    agent.state = 'trabajando'
    agent.task = text.slice(0, 280)
    agent.activity = [
      entry(0, `Tarea nueva: ${agent.task}`),
      ...agent.activity,
    ].slice(0, 8)
    this.emit()
  }

  private schedule() {
    const wait = 2600 + Math.random() * 1800
    setTimeout(() => {
      this.tick()
      this.schedule()
    }, wait)
  }

  private tick() {
    const agent = this.agents[Math.floor(Math.random() * this.agents.length)]
    if (!agent) return
    const next = this.nextState(agent.state)
    if (next === agent.state && next !== 'trabajando') return

    if (next === 'trabajando') {
      const pool = NEXT_TASK[agent.id] ?? ['Seguir con lo que tiene en el puesto.']
      agent.task = pick(pool, hash(agent.id + agent.activity.length + Date.now()))
      agent.activity = [entry(0, `Empezó: ${agent.task}`), ...agent.activity].slice(0, 8)
    } else if (next === 'esperando') {
      agent.activity = [
        entry(0, `Lo dejó listo y espera tu OK: ${agent.task}`),
        ...agent.activity,
      ].slice(0, 8)
    } else {
      agent.task = 'Día libre. Si le asignas algo, vuelve a su puesto.'
      agent.activity = [entry(0, 'Quedó libre y se fue a la sala.'), ...agent.activity].slice(0, 8)
    }
    agent.state = next
    this.emit()
  }

  private nextState(current: AgentState): AgentState {
    const libre = this.agents.filter((agent) => agent.state === 'libre').length
    const waiting = this.agents.filter((agent) => agent.state === 'esperando').length
    const roll = Math.random()
    if (current === 'trabajando') {
      if (roll < 0.42 && waiting < MAX_ESPERANDO) return 'esperando'
      if (roll < 0.72 && libre < MAX_LIBRE) return 'libre'
      return 'trabajando'
    }
    if (current === 'esperando') {
      if (roll < 0.6) return 'trabajando'
      if (roll < 0.78 && libre < MAX_LIBRE) return 'libre'
      return 'trabajando'
    }
    if (roll < 0.72) return 'trabajando'
    if (roll < 0.88 && waiting < MAX_ESPERANDO) return 'esperando'
    return 'libre'
  }

  private emit() {
    const snapshot = this.agents.map(clone)
    for (const listener of this.listeners) listener(snapshot)
  }
}

function clone(agent: Agent): Agent {
  return {
    ...agent,
    routines: agent.routines.map((routine) => ({ ...routine })),
    activity: agent.activity.map((item) => ({ ...item })),
  }
}
