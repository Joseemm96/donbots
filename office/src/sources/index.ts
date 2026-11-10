import type { AgentSource } from '../types'
import { HermesSource } from './hermes'
import { MockSource } from './mock'

let singleton: AgentSource | null = null

/** Una sola fuente por pestaña. `VITE_AGENT_SOURCE=hermes` cambia el adaptador. */
export function getSource(): AgentSource {
  if (singleton) return singleton
  const which = (import.meta.env.VITE_AGENT_SOURCE ?? 'mock').toLowerCase()
  singleton = which === 'hermes' ? new HermesSource() : new MockSource()
  return singleton
}
