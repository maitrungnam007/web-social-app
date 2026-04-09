/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // Them cac bien moi truong khac o day
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
