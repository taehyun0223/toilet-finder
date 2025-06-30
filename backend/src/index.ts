import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import dotenv from "dotenv";

import { createDependencies } from "@/config/dependency-injection";
import { createToiletRoutes } from "@/interfaces/routes/toilet-routes";
import { createTokyoSyncRoutes } from "@/interfaces/routes/tokyo-sync-routes";
import { createOverpassSyncRoutes } from "@/interfaces/routes/overpass-sync-routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        credentials: true,
    })
);
app.use(compression());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dependencies
const dependencies = createDependencies();

// Routes
app.use("/api/toilets", createToiletRoutes(dependencies.toiletController));
app.use(
    "/api/tokyo-sync",
    createTokyoSyncRoutes(dependencies.tokyoSyncController)
);
app.use(
    "/api/overpass-sync",
    createOverpassSyncRoutes(dependencies.overpassSyncController)
);

// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// 자동 동기화 스케줄러 (Overpass API 사용)
if (process.env.ENABLE_AUTO_SYNC === "true") {
    console.log("⏰ Overpass 데이터 자동 동기화 스케줄러 활성화");

    // 첫 동기화 (서버 시작 후 2분 뒤) - Overpass API 부하 고려
    setTimeout(async () => {
        try {
            console.log("🚀 초기 Overpass 데이터 동기화 시작");
            await dependencies.overpassDataSyncUseCase.scheduleSync();
        } catch (error) {
            console.error("❌ 초기 Overpass 동기화 실패:", error);
        }
    }, 120000); // 2분

    // 정기 동기화 (매 24시간마다)
    setInterval(async () => {
        try {
            await dependencies.overpassDataSyncUseCase.scheduleSync();
        } catch (error) {
            console.error("❌ 정기 Overpass 동기화 실패:", error);
        }
    }, 24 * 60 * 60 * 1000); // 24시간
}

// Error handling middleware
app.use(
    (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        console.error(err.stack);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "서버 내부 오류가 발생했습니다.",
            },
        });
    }
);

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: "NOT_FOUND",
            message: "요청하신 리소스를 찾을 수 없습니다.",
        },
    });
});

const server = app.listen(PORT, () => {
    console.log(`🚽 Toilet Finder API Server running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(
        `🗺️  API Endpoint: http://localhost:${PORT}/api/toilets/nearby`
    );
    console.log(
        `🌍 Overpass Sync API: http://localhost:${PORT}/api/overpass-sync/info`
    );
    console.log(
        `🔄 Tokyo Sync API: http://localhost:${PORT}/api/tokyo-sync/info (레거시)`
    );
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    server.close(() => {
        console.log("Server closed");
        dependencies.dbPool.end();
        process.exit(0);
    });
});

process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down gracefully");
    server.close(() => {
        console.log("Server closed");
        dependencies.dbPool.end();
        process.exit(0);
    });
});
