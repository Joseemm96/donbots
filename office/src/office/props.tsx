import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'

export function Desk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.08, 0.06, 0.58]} />
        <meshStandardMaterial color="#fbfbfa" roughness={0.45} />
      </mesh>
      {[
        [-0.44, -0.22],
        [0.44, -0.22],
        [-0.44, 0.22],
        [0.44, 0.22],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.34, z]}>
          <boxGeometry args={[0.045, 0.66, 0.045]} />
          <meshStandardMaterial color="#242424" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0.02, 0.76, 0.02]}>
        <boxGeometry args={[0.34, 0.018, 0.24]} />
        <meshStandardMaterial color="#d5d7de" />
      </mesh>
      <mesh position={[0.02, 0.86, -0.1]} rotation={[-0.42, 0, 0]}>
        <boxGeometry args={[0.34, 0.2, 0.016]} />
        <meshStandardMaterial color="#c5cad3" />
      </mesh>
    </group>
  )
}

export function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.13, 0.11, 0.22, 14]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <sphereGeometry args={[0.2, 18, 14]} />
        <meshStandardMaterial color="#7f9a62" roughness={0.85} />
      </mesh>
      <mesh position={[0.08, 0.46, 0.04]}>
        <sphereGeometry args={[0.13, 14, 12]} />
        <meshStandardMaterial color="#6d8a55" roughness={0.85} />
      </mesh>
    </group>
  )
}

export function Balloon({
  position,
  color,
}: {
  position: [number, number, number]
  color: string
}) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y =
      position[1] + Math.sin(clock.elapsedTime * 0.9 + position[0] * 2) * 0.07
  })
  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.2, 16, 14]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <coneGeometry args={[0.04, 0.08, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.46, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.42, 5]} />
        <meshStandardMaterial color="#8d8d8d" />
      </mesh>
    </group>
  )
}

export function Speaker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.42, 0.76, 0.36]} />
        <meshStandardMaterial color="#242424" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.52, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.04, 16]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
      <mesh position={[0, 0.24, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.04, 14]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
    </group>
  )
}

export function DiscoBall() {
  const ref = useRef<Group>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.55
  })
  return (
    <group ref={ref} position={[6.5, 2.45, 6.15]}>
      <mesh>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color="#d5dbe6" metalness={0.92} roughness={0.18} flatShading />
      </mesh>
      <mesh position={[0, 0.46, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.28, 6]} />
        <meshStandardMaterial color="#9aa3b2" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

export function DiscoSpots() {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.35
  })
  const spots = [
    { r: 1.15, a: 0.2, s: 0.34 },
    { r: 1.7, a: 1.3, s: 0.48 },
    { r: 2.15, a: 2.4, s: 0.28 },
    { r: 1.45, a: 3.5, s: 0.4 },
    { r: 2.35, a: 4.4, s: 0.32 },
    { r: 1.9, a: 5.3, s: 0.5 },
  ]
  return (
    <group ref={ref} position={[6.5, 0.045, 6.15]}>
      {spots.map((spot) => (
        <mesh
          key={spot.a}
          position={[Math.cos(spot.a) * spot.r, 0, Math.sin(spot.a) * spot.r]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[spot.s, 20]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
        </mesh>
      ))}
    </group>
  )
}
