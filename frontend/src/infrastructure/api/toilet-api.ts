import axios from "axios";
import { Toilet, Location } from "@/domain/entities/toilet";
import { ToiletRepository } from "@/domain/repositories/toilet-repository";

const API_BASE_URL =
    (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000/api";

export class ToiletApiRepository implements ToiletRepository {
    private api = axios.create({
        baseURL: API_BASE_URL,
        timeout: 10000,
    });

    async findNearbyToilets(
        location: Location,
        radius: number
    ): Promise<Toilet[]> {
        try {
            console.log("📡 API 호출 시작:", {
                url: `${API_BASE_URL}/toilets/nearby`,
                params: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    radius,
                },
            });

            const response = await this.api.get("/toilets/nearby", {
                params: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    radius: radius,
                },
            });

            console.log("📡 API 응답:", response.data);

            // 백엔드 응답 구조에 맞게 파싱
            if (response.data?.success && response.data?.data?.toilets) {
                const toilets = response.data.data.toilets;
                console.log("✅ 파싱된 화장실 데이터:", toilets);
                return Array.isArray(toilets) ? toilets : [];
            } else {
                console.warn("⚠️ 예상과 다른 응답 구조:", response.data);
                // 호환성을 위한 fallback
                const toilets = response.data?.toilets || response.data || [];
                return Array.isArray(toilets) ? toilets : [];
            }
        } catch (error) {
            const err = error as any;
            console.error("❌ API 호출 실패:", err);

            // 백엔드가 없을 때 임시 데이터 반환
            if (
                err?.code === "ECONNREFUSED" ||
                err?.message?.includes("Network Error") ||
                err?.message?.includes("ERR_NETWORK")
            ) {
                console.warn(
                    "⚠️ 백엔드 서버에 연결할 수 없음. 임시 데이터를 반환합니다."
                );
                return this.getMockToilets(location);
            }

            throw new Error("주변 화장실 정보를 가져올 수 없습니다.");
        }
    }

    private getMockToilets(location: Location): Toilet[] {
        // 임시 목 데이터
        return [
            {
                id: "mock-1",
                name: "서울시청 공공화장실",
                latitude: location.latitude + 0.001,
                longitude: location.longitude + 0.001,
                address: "서울특별시 중구 세종대로 110",
                type: "PUBLIC" as any,
                accessibility: true,
                operatingHours: "24시간",
                distance: 150,
            },
            {
                id: "mock-2",
                name: "명동역 화장실",
                latitude: location.latitude + 0.002,
                longitude: location.longitude - 0.001,
                address: "서울특별시 중구 명동2가",
                type: "PUBLIC" as any,
                accessibility: false,
                operatingHours: "05:30-24:00",
                distance: 280,
            },
        ];
    }

    async getToiletById(id: string): Promise<Toilet | null> {
        try {
            const response = await this.api.get(`/toilets/${id}`);
            return response.data.toilet;
        } catch (error) {
            console.error("화장실 정보 조회 실패:", error as any);
            return null;
        }
    }
}
