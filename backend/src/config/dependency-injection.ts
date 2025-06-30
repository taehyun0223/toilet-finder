import { Pool } from "pg";
import { createDatabasePool } from "@/config/database";
import { ToiletPostgresRepository } from "@/infrastructure/database/toilet-postgres-repository";
import { OverpassApiClient } from "@/infrastructure/external/overpass-api-client";
import { OverpassToiletRepository } from "@/infrastructure/external/overpass-toilet-repository";
import { ToiletRepository } from "@/domain/repositories/toilet-repository";
import { FindNearestToilets } from "@/application/use-cases/find-nearest-toilets";
import { ToiletController } from "@/interfaces/controllers/toilet-controller";

export interface Dependencies {
    dbPool: Pool;
    toiletRepository: ToiletRepository;
    overpassApiClient: OverpassApiClient;
    postgresRepository: ToiletPostgresRepository;
    findNearestToilets: FindNearestToilets;
    toiletController: ToiletController;
}

export const createDependencies = (): Dependencies => {
    // Infrastructure layer
    const dbPool = createDatabasePool();
    const postgresRepository = new ToiletPostgresRepository(dbPool);
    const overpassApiClient = new OverpassApiClient();
    const toiletRepository = new OverpassToiletRepository(overpassApiClient);

    // Application layer
    const findNearestToilets = new FindNearestToilets(toiletRepository);

    // Interface layer
    const toiletController = new ToiletController(
        findNearestToilets,
        toiletRepository
    );

    return {
        dbPool,
        toiletRepository,
        overpassApiClient,
        postgresRepository,
        findNearestToilets,
        toiletController,
    };
};
