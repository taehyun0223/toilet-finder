import { Location, ToiletWithDistance } from "@/domain/entities/toilet";
import { ToiletRepository } from "@/domain/repositories/toilet-repository";

export class FindNearbyToiletsUseCase {
    constructor(private toiletRepository: ToiletRepository) {}

    async execute(
        location: Location,
        radius: number = 1000
    ): Promise<ToiletWithDistance[]> {
        console.log("🔍 화장실 검색 시작:", { location, radius });

        // 화장실 목록을 가져옴
        const toilets = await this.toiletRepository.findNearbyToilets(
            location,
            radius
        );

        console.log("📍 기본 화장실 목록:", toilets.length + "개");

        // Places API가 사용 가능한지 확인
        const isPlacesAPIAvailable = window.google?.maps?.places?.PlacesService;

        if (!isPlacesAPIAvailable) {
            console.warn(
                "⚠️ Places API를 사용할 수 없습니다. 주변 장소 정보 없이 화장실 목록만 반환합니다."
            );
            console.log("💡 Places API 활성화 방법:");
            console.log("1. https://console.cloud.google.com/ 접속");
            console.log("2. APIs & Services > Library 이동");
            console.log("3. 'Places API' 검색 후 Enable");
            console.log("4. API 키에 Places API 권한 추가");

            // 주변 장소 정보 없이 반환
            return toilets.map((toilet) => ({
                ...toilet,
                nearbyPlaces: [],
            }));
        }

        console.log("✅ Places API 사용 가능 - 주변 장소 정보 추가 중...");

        // 각 화장실에 대해 주변 장소 정보 추가
        const toiletsWithPlaces: ToiletWithDistance[] = [];

        for (const toilet of toilets) {
            try {
                const nearbyPlaces = await this.findNearbyPlaces({
                    latitude: toilet.latitude,
                    longitude: toilet.longitude,
                });

                toiletsWithPlaces.push({
                    ...toilet,
                    nearbyPlaces,
                });
            } catch (error) {
                console.warn(
                    `화장실 ${toilet.id}의 주변 장소 검색 실패:`,
                    error
                );
                toiletsWithPlaces.push({
                    ...toilet,
                    nearbyPlaces: [],
                });
            }
        }

        console.log(
            `🏪 주변 장소 정보가 추가된 화장실: ${toiletsWithPlaces.length}개`
        );

        return toiletsWithPlaces;
    }

    /**
     * Google Places API를 사용해서 주변 장소 검색
     * 공식 문서: https://developers.google.com/maps/documentation/javascript/legacy/places
     */
    private async findNearbyPlaces(location: Location) {
        return new Promise<any[]>((resolve) => {
            // Google Maps API가 로드되었는지 확인
            if (!window.google?.maps?.places?.PlacesService) {
                console.warn("Google Places API가 로드되지 않았습니다.");
                resolve([]);
                return;
            }

            // 임시 지도 요소를 만들어서 PlacesService 생성 (공식 문서 권장 방식)
            const tempMapElement = document.createElement("div");
            const tempMap = new google.maps.Map(tempMapElement, {
                center: { lat: location.latitude, lng: location.longitude },
                zoom: 15,
            });

            const service = new google.maps.places.PlacesService(tempMap);

            // 공식 문서에 따른 nearbySearch 요청 구조
            const request: google.maps.places.PlaceSearchRequest = {
                location: new google.maps.LatLng(
                    location.latitude,
                    location.longitude
                ),
                radius: 100, // 50m에서 100m로 증가 (더 많은 결과 확보)
                // TypeScript 타입 정의에 맞춰 단일 type 사용
                type: "establishment",
            };

            console.log("📡 Places API 요청:", request);

            service.nearbySearch(request, (results, status) => {
                console.log("📡 Places API 응답 상태:", status);
                console.log(
                    "📡 Places API 상태 코드:",
                    google.maps.places.PlacesServiceStatus
                );

                // 공식 문서의 상태 코드 체크 방식
                if (
                    status === google.maps.places.PlacesServiceStatus.OK &&
                    results &&
                    results.length > 0
                ) {
                    console.log(
                        "✅ Places API 성공! 찾은 장소:",
                        results.length + "개"
                    );

                    const nearbyPlaces = results
                        .filter((place) => {
                            // 유효한 장소만 필터링
                            return (
                                place.name &&
                                place.geometry &&
                                place.geometry.location
                            );
                        })
                        .slice(0, 5) // 최대 5개로 증가
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

                    console.log("🏪 처리된 주변 장소:", nearbyPlaces);
                    resolve(nearbyPlaces);
                } else {
                    console.warn(
                        "Places API 검색 실패 또는 결과 없음:",
                        status
                    );

                    // 공식 문서의 상세한 오류 처리
                    switch (status) {
                        case google.maps.places.PlacesServiceStatus
                            .ZERO_RESULTS:
                            console.log(
                                "ℹ️ 해당 지역에 장소가 없습니다 (정상)"
                            );
                            break;
                        case google.maps.places.PlacesServiceStatus
                            .OVER_QUERY_LIMIT:
                            console.error("❌ API 쿼리 한도 초과");
                            console.log(
                                "💡 해결책: Google Cloud Console에서 할당량 확인"
                            );
                            break;
                        case google.maps.places.PlacesServiceStatus
                            .REQUEST_DENIED:
                            console.error("❌ API 요청 거부됨");
                            console.log("💡 해결책:");
                            console.log(
                                "1. Google Cloud Console에서 Places API 활성화 확인"
                            );
                            console.log("2. API 키에 Places API 권한 추가");
                            console.log("3. API 키 제한 설정 확인");
                            break;
                        case google.maps.places.PlacesServiceStatus
                            .INVALID_REQUEST:
                            console.error("❌ 잘못된 요청");
                            console.log("💡 요청 파라미터:", request);
                            break;
                        case google.maps.places.PlacesServiceStatus.NOT_FOUND:
                            console.warn("⚠️ 요청한 참조를 찾을 수 없음");
                            break;
                        default:
                            console.error("❌ 알 수 없는 오류:", status);
                    }

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
