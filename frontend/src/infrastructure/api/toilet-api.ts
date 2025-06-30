import axios from "axios";
import { Toilet, Location } from "@/domain/entities/toilet";
import { ToiletRepository } from "@/domain/repositories/toilet-repository";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

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
            const response = await this.api.get("/toilets/nearby", {
                params: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    radius: radius,
                },
            });
            return response.data.toilets;
        } catch (error) {
            console.error("API 호출 실패:", error);
            throw new Error("주변 화장실 정보를 가져올 수 없습니다.");
        }
    }

    async getToiletById(id: string): Promise<Toilet | null> {
        try {
            const response = await this.api.get(`/toilets/${id}`);
            return response.data.toilet;
        } catch (error) {
            console.error("화장실 정보 조회 실패:", error);
            return null;
        }
    }
}
