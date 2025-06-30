import { ToiletRepository } from "@/domain/repositories/toilet-repository";
import { Toilet, ToiletWithDistance, Location } from "@/domain/entities/toilet";
import { OverpassApiClient } from "./overpass-api-client";
import { DistanceCalculator } from "@/domain/services/distance-calculator";

export class OverpassToiletRepository implements ToiletRepository {
    constructor(private overpassClient: OverpassApiClient) {}

    async findNearbyToilets(
        location: Location,
        radiusInMeters: number
    ): Promise<ToiletWithDistance[]> {
        const toilets = await this.overpassClient.findToiletsNearLocation(
            location,
            radiusInMeters
        );

        return toilets.map((toilet) => ({
            ...toilet,
            distance: DistanceCalculator.calculateDistance(location, {
                latitude: toilet.latitude,
                longitude: toilet.longitude,
            }),
        }));
    }

    async findById(id: string): Promise<Toilet | null> {
        // Overpass API는 ID로 직접 검색이 제한적이므로
        // 실제 구현에서는 캐시나 다른 방법을 사용해야 할 수 있습니다
        throw new Error("findById는 Overpass API에서 지원되지 않습니다");
    }

    async save(toilet: Toilet): Promise<Toilet> {
        // Overpass API는 읽기 전용이므로 저장 기능은 지원하지 않습니다
        throw new Error("save는 Overpass API에서 지원되지 않습니다");
    }

    async update(id: string, toilet: Partial<Toilet>): Promise<Toilet | null> {
        // Overpass API는 읽기 전용이므로 업데이트 기능은 지원하지 않습니다
        throw new Error("update는 Overpass API에서 지원되지 않습니다");
    }

    async delete(id: string): Promise<boolean> {
        // Overpass API는 읽기 전용이므로 삭제 기능은 지원하지 않습니다
        throw new Error("delete는 Overpass API에서 지원되지 않습니다");
    }
}
