import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../..')
const officeSrc = path.join(repoRoot, 'office', 'src')
const botsDir = path.join(repoRoot, 'bots')
const catalogPath = path.join(officeSrc, 'data', 'bots.json')

const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'))
if (!Array.isArray(catalog) || catalog.length === 0) {
  throw new Error('bots.json no tiene agentes')
}

const ids = new Set()
for (const bot of catalog) {
  if (typeof bot.id !== 'string' || ids.has(bot.id)) {
    throw new Error(`id repetido o inválido: ${bot.id}`)
  }
  ids.add(bot.id)
  for (const key of ['name', 'tag', 'role', 'tagRole', 'area', 'color', 'skin']) {
    if (typeof bot[key] !== 'string' || bot[key].trim() === '') {
      throw new Error(`${bot.id} no tiene ${key}`)
    }
  }
  if (!Array.isArray(bot.routines)) throw new Error(`${bot.id} no tiene routines`)
}

const folders = readdirSync(botsDir).filter((name) => {
  if (name.startsWith('_')) return false
  const handoff = path.join(botsDir, name, 'HANDOFF.md')
  try {
    return statSync(handoff).isFile()
  } catch {
    return false
  }
})

const missing = folders.filter((name) => !ids.has(name))
const extra = [...ids].filter((id) => !folders.includes(id))
if (missing.length || extra.length) {
  throw new Error(
    `bots.json no cuadra con bots/*/HANDOFF.md. Faltan: ${missing.join(', ') || '—'}. Sobran: ${extra.join(', ') || '—'}.`,
  )
}

const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const phone = /\+\d{7,}|\b\d{8,}\b/
const SKIP_DIRS = new Set(['node_modules', 'dist'])

function scan(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry) || entry === 'package-lock.json') continue
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      scan(full)
      continue
    }
    if (!/\.(json|ts|tsx|md|css|html|mjs)$/.test(entry)) continue
    const text = readFileSync(full, 'utf8')
    if (email.test(text)) throw new Error(`parece un correo en ${path.relative(repoRoot, full)}`)
    if (phone.test(text)) throw new Error(`parece un número largo en ${path.relative(repoRoot, full)}`)
  }
}

scan(path.join(repoRoot, 'office'))
console.log(`ok: ${ids.size} bots, sin correos ni números largos en office/`)
