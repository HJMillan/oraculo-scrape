/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_WA_NUMBER?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
