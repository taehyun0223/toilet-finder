import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            "/api": {
                target: "http://localhost:8000",
                changeOrigin: true,
            },
        },
    },
    resolve: {
        alias: {
            "@": "/src",
            "@/presentation": "/src/presentation",
            "@/application": "/src/application",
            "@/domain": "/src/domain",
            "@/infrastructure": "/src/infrastructure",
            "@/config": "/src/config",
        },
    },
});
