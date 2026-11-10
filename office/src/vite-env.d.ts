/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AGENT_SOURCE?: string
  readonly VITE_HERMES_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
