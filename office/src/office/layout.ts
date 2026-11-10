import type { Agent, AreaId } from '../types'

export type RoomId = 'web' | 'contenido' | 'personal' | 'ceo' | 'esperando' | 'libre'

export interface Vec2 {
  x: number
  z: number
}

/** Pasillo este-oeste, al sur del escritorio de Don Bot y al norte de las salas de estado. */
export const SPINE_Z = 1.65

export const ROOMS: Record<
  RoomId,
  { x0: number; x1: number; z0: number; z1: number; floor: string }
> = {
  web: { x0: -15, x1: -5, z0: -11, z1: -3.2, floor: '#D3EBD6' },
  contenido: { x0: -5, x1: 5, z0: -11, z1: -3.2, floor: '#F8D4CE' },
  personal: { x0: 5, x1: 15, z0: -11, z1: -3.2, floor: '#D4DCF4' },
  ceo: { x0: 0.4, x1: 3.7, z0: -2.55, z1: 0.35, floor: '#F3EADF' },
  esperando: { x0: -15, x1: -3.6, z0: 2.5, z1: 9, floor: '#F6E0BE' },
  libre: { x0: -3.6, x1: 15, z0: 2.5, z1: 9, floor: '#4A3B52' },
}

export const DOORS: Record<Exclude<RoomId, 'ceo'>, Vec2> = {
  web: { x: -10, z: -3.2 },
  contenido: { x: 0, z: -3.2 },
  personal: { x: 10, z: -3.2 },
  esperando: { x: -9.2, z: 2.5 },
  libre: { x: 6.2, z: 2.5 },
}

export const HOME_SLOTS: Record<string, Vec2> = {
  'don-web-architect': { x: -13.4, z: -9.5 },
  'don-wordpress-implementer': { x: -10.6, z: -9.5 },
  'don-web-qa': { x: -7.6, z: -9.5 },
  'don-seo-specialist': { x: -13.2, z: -5.35 },
  'don-project-manager': { x: -7.4, z: -5.35 },
  'don-video': { x: -3.6, z: -9.2 },
  'don-researcher': { x: 0.15, z: -7.15 },
  'don-lcl3': { x: 3.15, z: -9.2 },
  'don-viaje': { x: 6.85, z: -9.2 },
  'don-maracucho': { x: 10.15, z: -6.9 },
  'don-finanzas': { x: 13.05, z: -9.2 },
  'don-bot': { x: 2.05, z: -0.05 },
}

export const STATE_SLOTS: Record<'esperando' | 'libre', Vec2[]> = {
  esperando: [
    { x: -13.3, z: 4.35 },
    { x: -11.0, z: 5.15 },
    { x: -8.7, z: 4.25 },
    { x: -6.3, z: 5.05 },
    { x: -12.4, z: 6.85 },
    { x: -9.5, z: 7.15 },
    { x: -7.0, z: 6.7 },
    { x: -11.2, z: 8.15 },
  ],
  libre: [
    { x: -1.15, z: 4.55 },
    { x: 1.35, z: 5.85 },
    { x: 3.7, z: 4.35 },
    { x: 6.15, z: 6.15 },
    { x: 8.55, z: 4.55 },
    { x: 11.0, z: 5.95 },
    { x: 13.15, z: 4.7 },
    { x: 0.35, z: 7.55 },
    { x: 4.55, z: 7.85 },
    { x: 8.85, z: 7.65 },
    { x: 12.15, z: 7.45 },
    { x: 5.4, z: 5.15 },
  ],
}

export const DISCO = { x: 6.5, z: 6.15 }

export function roomFor(agent: Pick<Agent, 'id' | 'area' | 'state'>): RoomId {
  if (agent.state === 'esperando') return 'esperando'
  if (agent.state === 'libre') return 'libre'
  return homeRoom(agent.area)
}

export function homeRoom(area: AreaId): RoomId {
  if (area === 'ceo') return 'ceo'
  if (area === 'web') return 'web'
  if (area === 'contenido') return 'contenido'
  return 'personal'
}

function hash(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function slotFor(agent: Agent, taken: { esperando: Set<number>; libre: Set<number> }): Vec2 {
  const room = roomFor(agent)
  if (room === 'esperando' || room === 'libre') {
    const slots = STATE_SLOTS[room]
    const used = taken[room]
    let index = hash(agent.id) % slots.length
    for (let step = 0; step < slots.length; step++) {
      const candidate = (index + step) % slots.length
      if (!used.has(candidate)) {
        used.add(candidate)
        index = candidate
        break
      }
    }
    return slots[index]
  }
  return HOME_SLOTS[agent.id] ?? { x: 0, z: 0 }
}

function inside(point: Vec2, room: RoomId): boolean {
  const rect = ROOMS[room]
  const pad = 0.15
  return (
    point.x > rect.x0 + pad &&
    point.x < rect.x1 - pad &&
    point.z > rect.z0 + pad &&
    point.z < rect.z1 - pad
  )
}

/** Salas con muro. El escritorio de Don Bot está en el lobby, sin puerta. */
function walledRoomAt(point: Vec2): Exclude<RoomId, 'ceo'> | null {
  const rooms: Exclude<RoomId, 'ceo'>[] = ['web', 'contenido', 'personal', 'esperando', 'libre']
  for (const room of rooms) {
    if (inside(point, room)) return room
  }
  return null
}

function dedupe(points: Vec2[]): Vec2[] {
  const out: Vec2[] = []
  for (const point of points) {
    const last = out[out.length - 1]
    if (!last || Math.hypot(last.x - point.x, last.z - point.z) > 0.05) out.push(point)
  }
  return out
}

function exitToSpine(room: Exclude<RoomId, 'ceo'>): Vec2[] {
  const door = DOORS[room]
  // Un paso afuera de la puerta antes de bajar o subir al pasillo, para no raspar el muro.
  const outside =
    room === 'esperando' || room === 'libre'
      ? { x: door.x, z: door.z - 0.45 }
      : { x: door.x, z: door.z + 0.45 }
  return [door, outside, { x: door.x, z: SPINE_Z }]
}

function entryFromSpine(room: RoomId, slot: Vec2): Vec2[] {
  if (room === 'ceo') {
    return [
      { x: slot.x, z: SPINE_Z },
      slot,
    ]
  }
  const door = DOORS[room]
  const outside =
    room === 'esperando' || room === 'libre'
      ? { x: door.x, z: door.z - 0.45 }
      : { x: door.x, z: door.z + 0.45 }
  return [{ x: door.x, z: SPINE_Z }, outside, door, slot]
}

/**
 * Camino en ejes por el pasillo. Las puertas quedan fuera de la columna
 * del escritorio de Don Bot, así que bajar en la x de la puerta no lo atraviesa.
 */
export function buildPath(from: Vec2, toRoom: RoomId, slot: Vec2): Vec2[] {
  const start = walledRoomAt(from)
  if (start === toRoom) return [slot]
  if (toRoom === 'ceo' && start === null && Math.hypot(from.x - slot.x, from.z - slot.z) < 0.4) {
    return []
  }

  const points: Vec2[] = []
  if (start) points.push(...exitToSpine(start))
  else points.push({ x: from.x, z: SPINE_Z })
  points.push(...entryFromSpine(toRoom, slot))
  return dedupe(points)
}
