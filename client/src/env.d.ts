/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PRINTAVO_API_URL: string
  readonly PRINTAVO_ACCESS_TOKEN: string
  readonly PRINTAVO_EMAIL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 