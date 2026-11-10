import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { OrthographicCamera } from 'three'
import type { Agent } from '../types'
import { Avatar } from './Avatar'
import {
  DOORS,
  HOME_SLOTS,
  ROOMS,
  STATE_SLOTS,
  roomFor,
  slotFor,
  type RoomId,
  type Vec2,
} from './layout'
import { Balloon, Desk, DiscoBall, DiscoSpots, Plant, Speaker } from './props'

const FRAME = '#2A2A2A'
const WALL_H = 1.02
/** Ties pill and name-tag size to the orthographic zoom so they shrink with the office. */
const LABEL_FACTOR = 0.019

const FRAMES = {
  overview: { look: [0, 0.15, -1.15] as const, spanX: 33, spanY: 24.5 },
  web: { look: [-10.2, 0.5, -8.4] as const, spanX: 16, spanY: 12.5 },
  libre: { look: [5.8, 0.55, 5.2] as const, spanX: 16, spanY: 13 },
}

function frameKeyFromHash(hash: string): keyof typeof FRAMES {
  if (hash === '#web' || hash === '#libre') return hash.slice(1) as 'web' | 'libre'
  return 'overview'
}

function CameraFit() {
  const { camera, size } = useThree()
  const [frameKey, setFrameKey] = useState(() => frameKeyFromHash(window.location.hash))
  useEffect(() => {
    const onHash = () => setFrameKey(frameKeyFromHash(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useLayoutEffect(() => {
    const ortho = camera as OrthographicCamera
    const frame = FRAMES[frameKey]
    const zoom = Math.min(size.width / frame.spanX, size.height / frame.spanY)
    ortho.zoom = Math.max(10, zoom)
    ortho.lookAt(frame.look[0], frame.look[1], frame.look[2])
    ortho.updateProjectionMatrix()
  }, [camera, size, frameKey])
  return null
}

function Floor({
  room,
  onClear,
}: {
  room: RoomId | 'lobby'
  onClear: () => void
}) {
  const rect =
    room === 'lobby'
      ? { x0: -15, x1: 15, z0: -3.2, z1: 2.5, floor: '#EFE8E0' }
      : ROOMS[room]
  const w = rect.x1 - rect.x0
  const d = rect.z1 - rect.z0
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[(rect.x0 + rect.x1) / 2, 0.02, (rect.z0 + rect.z1) / 2]}
      onClick={(event) => {
        event.stopPropagation()
        onClear()
      }}
    >
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={rect.floor} roughness={1} />
    </mesh>
  )
}

function Wall({
  x,
  z,
  w,
  d,
  glass,
}: {
  x: number
  z: number
  w: number
  d: number
  glass?: boolean
}) {
  const alongX = w >= d
  const length = alongX ? w : d
  const posts = glass ? Math.max(1, Math.round(length / 1.3)) : 0
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, WALL_H / 2, 0]}>
        <boxGeometry args={[w, WALL_H, d]} />
        <meshStandardMaterial
          color={glass ? '#f7f8fa' : FRAME}
          transparent={Boolean(glass)}
          opacity={glass ? 0.34 : 1}
          roughness={glass ? 0.06 : 0.8}
          metalness={glass ? 0.02 : 0}
          depthWrite={!glass}
        />
      </mesh>
      <mesh position={[0, WALL_H + 0.03, 0]}>
        <boxGeometry args={[alongX ? w : w + 0.04, 0.06, alongX ? d + 0.04 : d]} />
        <meshStandardMaterial color={FRAME} roughness={0.7} />
      </mesh>
      {glass &&
        Array.from({ length: posts + 1 }, (_, index) => {
          const offset = -length / 2 + (length * index) / posts
          return (
            <mesh key={index} position={[alongX ? offset : 0, WALL_H / 2, alongX ? 0 : offset]}>
              <boxGeometry
                args={alongX ? [0.035, WALL_H, d + 0.025] : [w + 0.025, WALL_H, 0.035]}
              />
              <meshStandardMaterial color={FRAME} />
            </mesh>
          )
        })}
      {glass && (
        <mesh position={[0, WALL_H * 0.58, 0]}>
          <boxGeometry args={alongX ? [w, 0.028, d + 0.03] : [w + 0.03, 0.028, d]} />
          <meshStandardMaterial color={FRAME} />
        </mesh>
      )}
    </group>
  )
}

function alongX(z: number, x0: number, x1: number, glass = false) {
  return { x: (x0 + x1) / 2, z, w: Math.abs(x1 - x0), d: 0.1, glass }
}

function alongZ(x: number, z0: number, z1: number, glass = false) {
  return { x, z: (z0 + z1) / 2, w: 0.1, d: Math.abs(z1 - z0), glass }
}

const WALLS = [
  alongX(-11, -15, 15),
  alongX(9, -15, 15),
  alongZ(-15, -11, 9),
  alongZ(15, -11, 9),
  alongZ(-5, -11, -3.2, true),
  alongZ(5, -11, -3.2, true),
  alongX(-3.2, -15, -10.9, true),
  alongX(-3.2, -9.1, -0.9, true),
  alongX(-3.2, 0.9, 9.1, true),
  alongX(-3.2, 10.9, 15, true),
  alongX(2.5, -15, -10.15, true),
  alongX(2.5, -8.25, 5.3, true),
  alongX(2.5, 7.1, 15, true),
  alongZ(-3.6, 2.5, 9, true),
]

function Pill({
  position,
  title,
  count,
  dot,
}: {
  position: [number, number, number]
  title: string
  count?: number
  dot: string
}) {
  return (
    <Html
      position={position}
      center
      distanceFactor={LABEL_FACTOR}
      zIndexRange={[5, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div className="pill">
        <span className="dot" style={{ background: dot }} />
        <span>{title}</span>
        {count !== undefined && (
          <span className="badge" style={{ background: dot }}>
            {count}
          </span>
        )}
      </div>
    </Html>
  )
}

function desksFor(ids: string[]) {
  return ids.map((id) => {
    const slot = HOME_SLOTS[id]
    return { id, position: [slot.x, 0, slot.z - 0.95] as [number, number, number] }
  })
}

const WORK_DESKS = desksFor([
  'don-web-architect',
  'don-wordpress-implementer',
  'don-web-qa',
  'don-seo-specialist',
  'don-project-manager',
  'don-video',
  'don-researcher',
  'don-lcl3',
  'don-viaje',
  'don-maracucho',
  'don-finanzas',
])

function usePlacements(agents: Agent[]) {
  const memory = useRef(new Map<string, { room: RoomId; slot: Vec2 }>())
  return useMemo(() => {
    const previous = memory.current
    const next = new Map<string, { room: RoomId; slot: Vec2 }>()
    const taken = { esperando: new Set<number>(), libre: new Set<number>() }
    const ordered = [...agents].sort((a, b) => {
      const aStay = previous.get(a.id)?.room === roomFor(a) ? 0 : 1
      const bStay = previous.get(b.id)?.room === roomFor(b) ? 0 : 1
      return aStay - bStay || a.id.localeCompare(b.id)
    })

    for (const agent of ordered) {
      const room = roomFor(agent)
      const prior = previous.get(agent.id)
      if (prior && prior.room === room && (room === 'esperando' || room === 'libre')) {
        const slots = STATE_SLOTS[room]
        const index = slots.findIndex((item) => item.x === prior.slot.x && item.z === prior.slot.z)
        if (index >= 0 && !taken[room].has(index)) {
          taken[room].add(index)
          next.set(agent.id, prior)
          continue
        }
      }
      const slot = slotFor(agent, taken)
      next.set(agent.id, { room, slot })
    }
    memory.current = next
    return next
  }, [agents])
}

export function OfficeScene({
  agents,
  selectedId,
  onSelect,
}: {
  agents: Agent[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const placements = usePlacements(agents)
  const count = (room: RoomId) =>
    agents.filter((agent) => placements.get(agent.id)?.room === room).length
  const ceoHome = agents.some(
    (agent) => agent.id === 'don-bot' && placements.get(agent.id)?.room === 'ceo',
  )

  return (
    <Canvas
      orthographic
      camera={{ position: [22, 24, 22], zoom: 48, near: 0.1, far: 220 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#F4F1EE']} />
      <hemisphereLight args={['#fff7f0', '#d5dee8', 0.95]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[10, 18, 8]} intensity={0.5} />
      <pointLight position={[6.5, 2.4, 6.15]} intensity={0.55} distance={8} color="#fff4ea" />
      <CameraFit />

      <mesh position={[0, -0.1, -1]}>
        <boxGeometry args={[30.7, 0.18, 20.7]} />
        <meshStandardMaterial color="#E7E2DA" roughness={1} />
      </mesh>

      {(['web', 'contenido', 'personal', 'esperando', 'libre', 'lobby'] as const).map((room) => (
        <Floor key={room} room={room} onClear={() => onSelect(null)} />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.05, 0.03, -1.15]}>
        <planeGeometry args={[3.5, 2.7]} />
        <meshStandardMaterial color="#F3EADF" roughness={1} />
      </mesh>

      {WALLS.map((wall, index) => (
        <Wall key={index} {...wall} />
      ))}

      {WORK_DESKS.map((desk) => (
        <Desk key={desk.id} position={desk.position} />
      ))}
      <Desk position={[2.05, 0, -1.15]} />

      <Plant position={[-14.15, 0, -10.15]} />
      <Plant position={[-5.7, 0, -10.15]} />
      <Plant position={[4.3, 0, -10.2]} />
      <Plant position={[14.15, 0, -10.15]} />
      <Plant position={[-14.2, 0, 8.15]} />
      <Plant position={[3.4, 0, -2.15]} />

      <mesh position={[-12.6, 0.28, 7.55]}>
        <cylinderGeometry args={[0.42, 0.42, 0.08, 20]} />
        <meshStandardMaterial color="#f7f4ef" />
      </mesh>
      <mesh position={[-12.6, 0.18, 7.55]}>
        <cylinderGeometry args={[0.06, 0.08, 0.32, 10]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      <Speaker position={[-2.55, 0, 3.7]} />
      <Speaker position={[-2.55, 0, 7.7]} />
      <Balloon position={[13.55, 1.15, 3.35]} color="#f9d423" />
      <Balloon position={[13.7, 1.35, 8.15]} color="#7dcea0" />
      <Balloon position={[-1.7, 1.25, 8.2]} color="#f7f7f7" />
      <Balloon position={[8.9, 1.15, 3.25]} color="#8eb6ff" />
      <Balloon position={[1.15, 1.4, 8.15]} color="#f5a3c7" />
      <DiscoBall />
      <DiscoSpots />

      <Pill position={[-10.2, 1.45, -11.55]} title="Web Dev" count={count('web')} dot="#22a06b" />
      <Pill
        position={[0.2, 1.45, -11.55]}
        title="Contenido / Research"
        count={count('contenido')}
        dot="#22a06b"
      />
      <Pill position={[10.2, 1.45, -11.55]} title="Personal" count={count('personal')} dot="#22a06b" />
      <Pill
        position={[2.05, 2.35, -2.15]}
        title="Don Bot · CEO"
        dot={ceoHome ? '#E4C56A' : '#b0b0b0'}
      />
      <Pill
        position={[-12.2, 2.45, 6.5]}
        title="Esperando tu OK"
        count={count('esperando')}
        dot="#f5a524"
      />
      <Pill position={[7.4, 2.15, 1.85]} title="Libre" count={count('libre')} dot="#e36aa2" />

      {agents.map((agent) => {
        const place = placements.get(agent.id)
        if (!place) return null
        return (
          <Avatar
            key={agent.id}
            agent={agent}
            room={place.room}
            slot={place.slot}
            selected={agent.id === selectedId}
            onSelect={onSelect}
          />
        )
      })}
      <DoorHints />
    </Canvas>
  )
}

function DoorHints() {
  const doors = Object.values(DOORS)
  return (
    <>
      {doors.map((door) => (
        <mesh key={`${door.x}${door.z}`} rotation={[-Math.PI / 2, 0, 0]} position={[door.x, 0.035, door.z]}>
          <planeGeometry args={[1.55, 0.28]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.28} />
        </mesh>
      ))}
    </>
  )
}
