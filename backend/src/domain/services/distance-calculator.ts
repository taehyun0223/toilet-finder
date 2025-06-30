import { Location } from "@/domain/entities/toilet";

export class DistanceCalculator {
    /**
     * 두 지점 간의 거리를 Haversine 공식으로 계산합니다.
     * @param from 시작 위치
     * @param to 도착 위치
     * @returns 거리 (미터)
     */
    static calculateDistance(from: Location, to: Location): number {
        const R = 6371e3; // 지구 반지름 (미터)
        const φ1 = (from.latitude * Math.PI) / 180; // φ, λ in radians
        const φ2 = (to.latitude * Math.PI) / 180;
        const Δφ = ((to.latitude - from.latitude) * Math.PI) / 180;
        const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c; // 거리 (미터)
        return Math.round(distance);
    }

    /**
     * 주어진 위치에서 특정 반경 내에 있는지 확인합니다.
     * @param center 중심 위치
     * @param target 대상 위치
     * @param radiusInMeters 반경 (미터)
     * @returns 반경 내에 있으면 true
     */
    static isWithinRadius(
        center: Location,
        target: Location,
        radiusInMeters: number
    ): boolean {
        const distance = this.calculateDistance(center, target);
        return distance <= radiusInMeters;
    }
}
