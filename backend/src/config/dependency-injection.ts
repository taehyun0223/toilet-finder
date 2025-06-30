import { Pool } from "pg";
import { createDatabasePool } from "@/config/database";
import { ToiletPostgresRepository } from "@/infrastructure/database/toilet-postgres-repository";
import { OverpassApiClient } from "@/infrastructure/external/overpass-api-client";
import { OverpassToiletRepository } from "@/infrastructure/external/overpass-toilet-repository";
import { TokyoApiClient } from "@/infrastructure/external/tokyo-api-client";
import { TokyoToiletRepository } from "@/infrastructure/external/tokyo-toilet-repository";
import { ToiletRepository } from "@/domain/repositories/toilet-repository";
import { FindNearestToilets } from "@/application/use-cases/find-nearest-toilets";
import { ToiletController } from "@/interfaces/controllers/toilet-controller";
import { TokyoDataSyncUseCase } from "@/application/use-cases/tokyo-data-sync";
import { TokyoSyncController } from "@/interfaces/controllers/tokyo-sync-controller";
import { OverpassDataSyncUseCase } from "@/application/use-cases/overpass-data-sync";
import { OverpassSyncController } from "@/interfaces/controllers/overpass-sync-controller";

export interface Dependencies {
    dbPool: Pool;
    toiletRepository: ToiletRepository;
    overpassApiClient: OverpassApiClient;
    postgresRepository: ToiletPostgresRepository;
    findNearestToilets: FindNearestToilets;
    toiletController: ToiletController;
    tokyoDataSyncUseCase: TokyoDataSyncUseCase;
    tokyoSyncController: TokyoSyncController;
    overpassDataSyncUseCase: OverpassDataSyncUseCase;
    overpassSyncController: OverpassSyncController;
}

export const createDependencies = (): Dependencies => {
    // Infrastructure layer
    const dbPool = createDatabasePool();
    const postgresRepository = new ToiletPostgresRepository(dbPool);
    const overpassApiClient = new OverpassApiClient();
    const tokyoApiClient = new TokyoApiClient();

    // Repository 선택 로직
    const useDatabase = process.env.USE_DATABASE === "true";
    const useTokyoApi = process.env.USE_TOKYO_API === "true";

    let toiletRepository: ToiletRepository;

    if (useDatabase) {
        console.log("📂 PostgreSQL 데이터베이스 사용 (Overpass 데이터 저장됨)");
        toiletRepository = postgresRepository;
    } else if (useTokyoApi) {
        console.log("🗾 도쿄 오픈데이터 API 사용 (레거시)");
        toiletRepository = new TokyoToiletRepository(tokyoApiClient);
    } else {
        console.log("🌍 Overpass API 직접 사용 (실시간)");
        toiletRepository = new OverpassToiletRepository(overpassApiClient);
    }

    // Application layer
    const findNearestToilets = new FindNearestToilets(toiletRepository);

    // Interface layer
    const toiletController = new ToiletController(
        findNearestToilets,
        toiletRepository
    );

    // Tokyo Data Sync Use Case (레거시)
    const tokyoDataSyncUseCase = new TokyoDataSyncUseCase(
        tokyoApiClient,
        postgresRepository
    );

    // Tokyo Sync Controller (레거시)
    const tokyoSyncController = new TokyoSyncController(tokyoDataSyncUseCase);

    // Overpass Data Sync Use Case (메인)
    const overpassDataSyncUseCase = new OverpassDataSyncUseCase(
        overpassApiClient,
        postgresRepository
    );

    // Overpass Sync Controller (메인)
    const overpassSyncController = new OverpassSyncController(
        overpassDataSyncUseCase
    );

    return {
        dbPool,
        toiletRepository,
        overpassApiClient,
        postgresRepository,
        findNearestToilets,
        toiletController,
        tokyoDataSyncUseCase,
        tokyoSyncController,
        overpassDataSyncUseCase,
        overpassSyncController,
    };
};
