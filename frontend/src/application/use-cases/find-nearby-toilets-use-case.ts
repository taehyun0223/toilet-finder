import { Location, ToiletWithDistance } from "@/domain/entities/toilet";
import { ToiletRepository } from "@/domain/repositories/toilet-repository";

export class FindNearbyToiletsUseCase {
    constructor(private toiletRepository: ToiletRepository) {}

    async execute(
        location: Location,
        radius: number = 1000
    ): Promise<ToiletWithDistance[]> {
        // 화장실 목록을 가져옴
        const toilets = await this.toiletRepository.findNearbyToilets(
            location,
            radius
        );

        // 각 화장실에 대해 주변 장소 정보 추가
        const toiletsWithPlaces = await Promise.all(
            toilets.map(async (toilet) => {
                try {
                    // Google Places API를 사용해서 주변 장소 검색
                    const nearbyPlaces = await this.findNearbyPlaces({
                        latitude: toilet.latitude,
                        longitude: toilet.longitude,
                    });

                    return {
                        ...toilet,
                        nearbyPlaces,
                    };
                } catch (error) {
                    console.warn(
                        `화장실 ${toilet.id}의 주변 장소 검색 실패:`,
                        error
                    );
                    return {
                        ...toilet,
                        nearbyPlaces: [],
                    };
                }
            })
        );

        return toiletsWithPlaces;
    }

    /**
     * Google Places API를 사용해서 주변 장소 검색
     */
    private async findNearbyPlaces(location: Location) {
        return new Promise<any[]>((resolve) => {
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
                radius: 50, // 50미터 반경으로 축소 (화장실 근처만)
                type: "establishment",
            };

            service.nearbySearch(request, (results, status) => {
                if (
                    status === google.maps.places.PlacesServiceStatus.OK &&
                    results
                ) {
                    const nearbyPlaces = results
                        .slice(0, 3) // 최대 3개로 축소
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
                                koreanType: this.getPlaceTypeInKorean(
                                    place.types || []
                                ),
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
    private getPlaceTypeInKorean(types: string[]): string {
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
            store: "상점",
            establishment: "시설",
            point_of_interest: "관심지점",
        };

        // 가장 구체적인 타입 찾기
        for (const type of types) {
            if (typeMap[type]) {
                return typeMap[type];
            }
        }

        return "시설";
    }
}
