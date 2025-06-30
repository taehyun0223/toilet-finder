import { ToiletRepository } from "@/domain/repositories/toilet-repository";
import { Toilet, ToiletWithDistance, Location } from "@/domain/entities/toilet";
import { TokyoApiClient } from "./tokyo-api-client";
import { DistanceCalculator } from "@/domain/services/distance-calculator";

export class TokyoToiletRepository implements ToiletRepository {
    constructor(private tokyoClient: TokyoApiClient) {}

    async findNearbyToilets(
        location: Location,
        radiusInMeters: number
    ): Promise<ToiletWithDistance[]> {
        console.log("🗾 도쿄 Repository: 화장실 검색 시작", {
            location,
            radiusInMeters,
        });

        const toilets = await this.tokyoClient.findToiletsNearLocation(
            location,
            radiusInMeters
        );

        console.log(`🗾 도쿄 Repository: ${toilets.length}개 화장실 발견`);

        return toilets.map((toilet) => ({
            ...toilet,
            distance: DistanceCalculator.calculateDistance(location, {
                latitude: toilet.latitude,
                longitude: toilet.longitude,
            }),
        }));
    }

    async findById(id: string): Promise<Toilet | null> {
        // 도쿄 API는 ID 검색이 제한적이므로 구현하지 않음
        console.warn("⚠️ 도쿄 API에서는 ID 검색을 지원하지 않습니다");
        return null;
    }

    async save(toilet: Toilet): Promise<Toilet> {
        // 도쿄 API는 읽기 전용
        throw new Error("도쿄 API는 읽기 전용입니다");
    }

    async update(id: string, toilet: Partial<Toilet>): Promise<Toilet | null> {
        // 도쿄 API는 읽기 전용
        throw new Error("도쿄 API는 읽기 전용입니다");
    }

    async delete(id: string): Promise<boolean> {
        // 도쿄 API는 읽기 전용
        throw new Error("도쿄 API는 읽기 전용입니다");
    }
}
