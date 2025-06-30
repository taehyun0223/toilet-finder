import { Toilet, Location } from "@/domain/entities/toilet";
import { ToiletRepository } from "@/domain/repositories/toilet-repository";

export class FindNearbyToiletsUseCase {
    constructor(private toiletRepository: ToiletRepository) {}

    async execute(
        location: Location,
        radius: number = 1000
    ): Promise<Toilet[]> {
        try {
            console.log("🔍 UseCase 실행:", { location, radius });
            const toilets = await this.toiletRepository.findNearbyToilets(
                location,
                radius
            );
            console.log("📡 Repository 응답:", toilets);

            // 안전한 배열 처리
            if (!Array.isArray(toilets)) {
                console.warn("⚠️ toilets가 배열이 아님:", toilets);
                return [];
            }

            return toilets.sort(
                (a, b) => (a.distance || 0) - (b.distance || 0)
            );
        } catch (error) {
            console.error("주변 화장실 검색 중 오류 발생:", error);
            throw new Error("주변 화장실을 찾을 수 없습니다.");
        }
    }
}
