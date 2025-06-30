import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import dotenv from "dotenv";

import { createDependencies } from "@/config/dependency-injection";
import { createToiletRoutes } from "@/interfaces/routes/toilet-routes";

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

// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

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
