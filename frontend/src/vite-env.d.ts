/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_APP_ENV: string;
    readonly VITE_ENABLE_DEVTOOLS: string;
    readonly VITE_MAX_FILE_SIZE: string;
    readonly VITE_SUPPORTED_FILE_TYPES: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
