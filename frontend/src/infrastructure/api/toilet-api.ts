import axios from "axios";
import {
    Toilet,
    Location,
    ToiletWithDistance,
    NearbyPlace,
} from "@/domain/entities/toilet";
import { ToiletRepository } from "@/domain/repositories/toilet-repository";

const API_BASE_URL =
    (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000/api";

export interface ToiletApiResponse {
    toilets: ToiletWithDistance[];
}

export class ToiletApiRepository implements ToiletRepository {
    private api = axios.create({
        baseURL: API_BASE_URL,
        timeout: 10000,
    });

    async findNearbyToilets(
        location: Location,
        radius: number
    ): Promise<ToiletWithDistance[]> {
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

    private getMockToilets(location: Location): ToiletWithDistance[] {
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
                createdAt: new Date(),
                updatedAt: new Date(),
                distance: 150,
                nearbyPlaces: [],
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
                createdAt: new Date(),
                updatedAt: new Date(),
                distance: 280,
                nearbyPlaces: [],
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

    /**
     * Google Places API를 사용해서 주변 장소 검색
     */
    async findNearbyPlaces(location: Location): Promise<NearbyPlace[]> {
        return new Promise((resolve) => {
            // Google Maps API가 로드되었는지 확인
            if (!window.google?.maps?.places?.PlacesService) {
                console.warn("Google Places API가 로드되지 않았습니다.");
                resolve([]);
                return;
            }

            // 임시 지도 요소를 만들어서 PlacesService 생성
            const tempMapElement = document.createElement("div");
            const tempMap = new google.maps.Map(tempMapElement, {
                center: { lat: location.latitude, lng: location.longitude },
                zoom: 15,
            });

            const service = new google.maps.places.PlacesService(tempMap);

            const request: google.maps.places.PlaceSearchRequest = {
                location: { lat: location.latitude, lng: location.longitude },
                radius: 100, // 100미터 반경
                type: "establishment", // 모든 종류의 사업장
            };

            service.nearbySearch(request, (results, status) => {
                if (
                    status === google.maps.places.PlacesServiceStatus.OK &&
                    results
                ) {
                    const nearbyPlaces: NearbyPlace[] = results
                        .slice(0, 5) // 최대 5개
                        .map((place) => {
                            const distance = this.calculateDistance(
                                location.latitude,
                                location.longitude,
                                place.geometry?.location?.lat() ||
                                    location.latitude,
                                place.geometry?.location?.lng() ||
                                    location.longitude
                            );

                            return {
                                name: place.name || "알 수 없는 장소",
                                types: place.types || [],
                                distance: Math.round(distance),
                                placeId: place.place_id,
                                rating: place.rating,
                                vicinity: place.vicinity,
                            };
                        })
                        .sort((a, b) => a.distance - b.distance); // 거리순 정렬

                    resolve(nearbyPlaces);
                } else {
                    console.warn("주변 장소 검색 실패:", status);
                    resolve([]);
                }
            });
        });
    }

    /**
     * 두 좌표 간의 거리 계산 (미터)
     */
    private calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371e3; // 지구 반지름 (미터)
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * 장소 타입을 한국어로 변환
     */
    static getPlaceTypeInKorean(types: string[]): string {
        const typeMap: { [key: string]: string } = {
            convenience_store: "편의점",
            gas_station: "주유소",
            restaurant: "음식점",
            cafe: "카페",
            bank: "은행",
            atm: "ATM",
            pharmacy: "약국",
            hospital: "병원",
            subway_station: "지하철역",
            bus_station: "버스정류장",
            school: "학교",
            university: "대학교",
            shopping_mall: "쇼핑몰",
            supermarket: "마트",
            department_store: "백화점",
            hotel: "호텔",
            tourist_attraction: "관광지",
            park: "공원",
            gym: "헬스장",
            beauty_salon: "미용실",
            laundry: "세탁소",
        };

        for (const type of types) {
            if (typeMap[type]) {
                return typeMap[type];
            }
        }

        return "시설";
    }
}
