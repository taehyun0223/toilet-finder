/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_APP_TITLE: string;
    readonly VITE_APP_DESCRIPTION: string;
    readonly VITE_GOOGLE_MAPS_API_KEY: string;
    readonly VITE_DEV_MODE: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
