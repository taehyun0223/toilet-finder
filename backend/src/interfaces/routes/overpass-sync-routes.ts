import { Router } from "express";
import { OverpassSyncController } from "@/interfaces/controllers/overpass-sync-controller";

export const createOverpassSyncRoutes = (
    overpassSyncController: OverpassSyncController
): Router => {
    const router = Router();

    // 전체 데이터 동기화
    router.post("/sync", (req, res) =>
        overpassSyncController.syncData(req, res)
    );

    // 특정 지역 데이터 동기화
    router.post("/sync/area", (req, res) =>
        overpassSyncController.syncSpecificArea(req, res)
    );

    // 데이터 정보 조회
    router.get("/info", (req, res) =>
        overpassSyncController.getDataInfo(req, res)
    );

    // 시스템 상태 및 통계
    router.get("/stats", (req, res) =>
        overpassSyncController.getSystemStats(req, res)
    );

    // 지원되는 도시 목록
    router.get("/cities", (req, res) =>
        overpassSyncController.getSupportedCities(req, res)
    );

    // 오래된 데이터 정리
    router.delete("/cleanup", (req, res) =>
        overpassSyncController.cleanupOldData(req, res)
    );

    return router;
};
