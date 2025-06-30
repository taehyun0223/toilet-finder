import { Router } from "express";
import { TokyoSyncController } from "@/interfaces/controllers/tokyo-sync-controller";

export function createTokyoSyncRoutes(
    tokyoSyncController: TokyoSyncController
): Router {
    const router = Router();

    // 도쿄 데이터 정보 조회
    router.get("/info", (req, res) =>
        tokyoSyncController.getDataInfo(req, res)
    );

    // 시스템 상태 및 통계 조회
    router.get("/stats", (req, res) =>
        tokyoSyncController.getSystemStats(req, res)
    );

    // 수동 데이터 동기화 실행
    router.post("/sync", (req, res) => tokyoSyncController.syncData(req, res));

    // 오래된 데이터 정리
    router.post("/cleanup", (req, res) =>
        tokyoSyncController.cleanupOldData(req, res)
    );

    return router;
}
