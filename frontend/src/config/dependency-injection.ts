import { ToiletApiRepository } from "@/infrastructure/api/toilet-api";
import { FindNearbyToiletsUseCase } from "@/application/use-cases/find-nearby-toilets-use-case";

// Repository 인스턴스 생성
export const toiletRepository = new ToiletApiRepository();

// Use Case 인스턴스 생성
export const findNearbyToiletsUseCase = new FindNearbyToiletsUseCase(
    toiletRepository
);
