import { ToiletRepository } from "@/domain/repositories/toilet-repository";
import { ToiletWithDistance, Location } from "@/domain/entities/toilet";

export interface FindNearestToiletsRequest {
    location: Location;
    radiusInMeters?: number;
    limit?: number;
}

export interface FindNearestToiletsResponse {
    toilets: ToiletWithDistance[];
    total: number;
}

export class FindNearestToilets {
    constructor(private toiletRepository: ToiletRepository) {}

    async execute(
        request: FindNearestToiletsRequest
    ): Promise<FindNearestToiletsResponse> {
        const { location, radiusInMeters = 1000, limit = 10 } = request;

        try {
            // 주변 화장실 검색
            const toilets = await this.toiletRepository.findNearbyToilets(
                location,
                radiusInMeters
            );

            // 거리순으로 정렬하고 제한된 개수만 반환
            const sortedToilets = toilets
                .sort((a, b) => a.distance - b.distance)
                .slice(0, limit);

            return {
                toilets: sortedToilets,
                total: toilets.length,
            };
        } catch (error) {
            console.error("주변 화장실 검색 중 오류 발생:", error);
            throw new Error("주변 화장실을 찾을 수 없습니다.");
        }
    }
}
