import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Group } from 'three'
import type { Agent } from '../types'
import { DISCO, buildPath, type RoomId, type Vec2 } from './layout'

const LABEL_FACTOR = 0.019

const HATS = ['#f9a8d4', '#93c5fd', '#fde68a', '#86efac', '#fdba74', '#c4b5fd']
const SPEED = 3.6

function hash(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 33 + text.charCodeAt(i)) | 0
  return Math.abs(h)
}

function dampAngle(current: number, target: number, delta: number): number {
  let diff = target - current
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return current + diff * Math.min(1, delta * 8)
}

export function Avatar({
  agent,
  room,
  slot,
  selected,
  onSelect,
}: {
  agent: Agent
  room: RoomId
  slot: Vec2
  selected: boolean
  onSelect: (id: string) => void
}) {
  const group = useRef<Group>(null)
  const hips = useRef<Group>(null)
  const torso = useRef<Group>(null)
  const leftLeg = useRef<Group>(null)
  const rightLeg = useRef<Group>(null)
  const leftArm = useRef<Group>(null)
  const rightArm = useRef<Group>(null)
  const pos = useRef({ x: slot.x, z: slot.z })
  const waypoints = useRef<Vec2[]>([])
  const placed = useRef(false)
  const phase = hash(agent.id) / 100
  const hat = HATS[hash(agent.id) % HATS.length]

  useLayoutEffect(() => {
    const root = group.current
    if (!root) return
    if (!placed.current) {
      root.position.set(slot.x, 0, slot.z)
      pos.current = { x: slot.x, z: slot.z }
      placed.current = true
      waypoints.current = []
      return
    }
    waypoints.current = buildPath(pos.current, room, slot)
  }, [room, slot.x, slot.z, slot])

  useFrame(({ clock }, delta) => {
    const root = group.current
    if (!root) return
    const t = clock.elapsedTime + phase
    let moving = false
    const next = waypoints.current[0]
    if (next) {
      const dx = next.x - pos.current.x
      const dz = next.z - pos.current.z
      const dist = Math.hypot(dx, dz)
      if (dist < 0.06) {
        waypoints.current.shift()
      } else {
        moving = true
        const step = Math.min(dist, SPEED * delta)
        pos.current.x += (dx / dist) * step
        pos.current.z += (dz / dist) * step
        root.position.x = pos.current.x
        root.position.z = pos.current.z
        root.rotation.y = dampAngle(root.rotation.y, Math.atan2(dx, dz), delta)
      }
    }

    const arrived = waypoints.current.length === 0
    if (arrived && !moving) {
      const face =
        agent.state === 'libre'
          ? Math.atan2(DISCO.x - pos.current.x, DISCO.z - pos.current.z)
          : agent.state === 'trabajando'
            ? Math.PI
            : 0.35
      root.rotation.y = dampAngle(root.rotation.y, face, delta)
    }

    const legL = leftLeg.current
    const legR = rightLeg.current
    const armL = leftArm.current
    const armR = rightArm.current
    const hip = hips.current
    const chest = torso.current
    if (!legL || !legR || !armL || !armR || !hip || !chest) return

    if (moving) {
      const s = Math.sin(t * 12)
      legL.rotation.x = s * 0.8
      legR.rotation.x = -s * 0.8
      armL.rotation.x = -s * 0.6
      armR.rotation.x = s * 0.6
      armL.rotation.z = 0.16
      armR.rotation.z = -0.16
      hip.position.y = Math.abs(s) * 0.05
      chest.rotation.y = 0
    } else if (agent.state === 'libre') {
      const s = Math.sin(t * 6.4)
      legL.rotation.x = 0.12
      legR.rotation.x = -0.08
      armL.rotation.x = -0.15
      armR.rotation.x = -0.15
      armL.rotation.z = 1.05 + s * 0.65
      armR.rotation.z = -1.05 - Math.sin(t * 6.4 + 0.4) * 0.65
      hip.position.y = Math.abs(s) * 0.13
      chest.rotation.y = s * 0.18
    } else if (agent.state === 'trabajando') {
      const s = Math.sin(t * 3.4)
      legL.rotation.x = 0
      legR.rotation.x = 0
      armL.rotation.x = -0.7 + s * 0.14
      armR.rotation.x = -0.45 - s * 0.12
      armL.rotation.z = 0.28
      armR.rotation.z = -0.22
      hip.position.y = 0
      chest.rotation.y = 0
    } else {
      const s = Math.sin(t * 1.5)
      legL.rotation.x = 0
      legR.rotation.x = 0
      armL.rotation.x = 0.08
      armR.rotation.x = 0.05
      armL.rotation.z = 0.1
      armR.rotation.z = -0.1
      hip.position.y = 0
      chest.rotation.y = s * 0.06
    }
  })

  const scale = agent.area === 'ceo' ? 1.22 : 1.14
  const lift = (hash(agent.id) % 3) * 0.16

  return (
    <group ref={group}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <circleGeometry args={[0.26, 18]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.13} />
      </mesh>
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.32, 0.4, 28]} />
          <meshBasicMaterial color={agent.color} />
        </mesh>
      )}
      <mesh
        position={[0, 0.78, 0]}
        onClick={(event) => {
          event.stopPropagation()
          onSelect(agent.id)
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = ''
        }}
      >
        <cylinderGeometry args={[0.34, 0.34, 1.55, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={hips} scale={scale}>
        <group ref={leftLeg} position={[-0.09, 0.48, 0]}>
          <mesh position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.055, 0.26, 4, 8]} />
            <meshStandardMaterial color="#2c3038" roughness={0.7} />
          </mesh>
        </group>
        <group ref={rightLeg} position={[0.09, 0.48, 0]}>
          <mesh position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.055, 0.26, 4, 8]} />
            <meshStandardMaterial color="#2c3038" roughness={0.7} />
          </mesh>
        </group>

        <group ref={torso}>
          <mesh position={[0, 0.78, 0]}>
            <capsuleGeometry args={[0.19, 0.32, 6, 16]} />
            <meshStandardMaterial color={agent.color} roughness={0.72} />
          </mesh>
          <mesh position={[0, 1.22, 0]}>
            <sphereGeometry args={[0.185, 24, 18]} />
            <meshStandardMaterial color={agent.skin} roughness={0.62} />
          </mesh>
          {agent.accent && (
            <mesh position={[0, 0.72, 0.14]}>
              <boxGeometry args={[0.055, 0.18, 0.02]} />
              <meshStandardMaterial color={agent.accent} roughness={0.45} />
            </mesh>
          )}
          {agent.state === 'libre' && (
            <mesh position={[0, 1.5, 0]}>
              <coneGeometry args={[0.16, 0.3, 12]} />
              <meshStandardMaterial color={hat} roughness={0.55} />
            </mesh>
          )}
          <group ref={leftArm} position={[-0.26, 0.98, 0]}>
            <mesh position={[0, -0.18, 0]}>
              <capsuleGeometry args={[0.042, 0.2, 4, 8]} />
              <meshStandardMaterial color={agent.color} roughness={0.72} />
            </mesh>
            <mesh position={[0, -0.34, 0]}>
              <sphereGeometry args={[0.048, 10, 10]} />
              <meshStandardMaterial color={agent.skin} roughness={0.6} />
            </mesh>
          </group>
          <group ref={rightArm} position={[0.26, 0.98, 0]}>
            <mesh position={[0, -0.18, 0]}>
              <capsuleGeometry args={[0.042, 0.2, 4, 8]} />
              <meshStandardMaterial color={agent.color} roughness={0.72} />
            </mesh>
            <mesh position={[0, -0.34, 0]}>
              <sphereGeometry args={[0.048, 10, 10]} />
              <meshStandardMaterial color={agent.skin} roughness={0.6} />
            </mesh>
          </group>
        </group>
      </group>

      <Html
        position={[0, 2.05 + lift, 0]}
        center
        distanceFactor={LABEL_FACTOR}
        zIndexRange={[7, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className={selected ? 'tag tag-on' : 'tag'}>
          <b>{agent.tag}</b>
          <span>{agent.tagRole}</span>
        </div>
      </Html>
    </group>
  )
}
