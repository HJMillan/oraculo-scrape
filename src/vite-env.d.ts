/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_WA_NUMBER?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

/** Versión de package.json, inyectada en build time por Vite. */
declare const __APP_VERSION__: string;

/** SHA corto del commit desplegado ('dev' fuera de Vercel). */
declare const __APP_COMMIT__: string;
