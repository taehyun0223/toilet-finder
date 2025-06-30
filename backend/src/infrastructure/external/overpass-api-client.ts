import axios from "axios";
import { Location, Toilet, ToiletType } from "@/domain/entities/toilet";

interface OverpassElement {
    type: "node" | "way" | "relation";
    id: number;
    lat?: number;
    lon?: number;
    center?: {
        lat: number;
        lon: number;
    };
    tags?: Record<string, string>;
    timestamp?: string;
    version?: number;
    changeset?: number;
    user?: string;
    uid?: number;
}

interface OverpassResponse {
    version: number;
    generator: string;
    osm3s: {
        timestamp_osm_base: string;
        copyright: string;
    };
    elements: OverpassElement[];
}

export class OverpassApiClient {
    // 일본 엔드포인트를 우선적으로 사용하도록 설정
    private readonly endpoints = [
        "https://overpass.osm.jp/api/interpreter",
        "https://overpass.private.coffee/api/interpreter",
        "https://overpass.openstreetmap.ru/api/interpreter",
        "https://overpass-api.de/api/interpreter",
    ];
    private currentEndpointIndex = 0;
    private readonly timeout = 30000; // 30초로 단축
    private readonly maxsize = 536870912; // 512MB
    private cachedToilets: Toilet[] | null = null;
    private lastFetchTime: number = 0;
    private cacheValidDuration = 30 * 60 * 1000; // 30분

    async findToiletsNearLocation(
        location: Location,
        radiusInMeters: number
    ): Promise<Toilet[]> {
        console.log("🗺️ Overpass API: 화장실 검색 시작", {
            location,
            radiusInMeters,
        });

        const query = this.buildOverpassQuery(location, radiusInMeters);

        return await this.executeQueryWithFailover(query, location);
    }

    private async executeQueryWithFailover(
        query: string,
        userLocation?: Location
    ): Promise<Toilet[]> {
        let lastError: any;

        // 모든 엔드포인트를 시도
        for (let attempt = 0; attempt < this.endpoints.length; attempt++) {
            const currentUrl = this.endpoints[this.currentEndpointIndex];

            try {
                console.log(
                    `📡 Overpass API 호출 중... (엔드포인트: ${currentUrl})`
                );

                const response = await axios.post<OverpassResponse>(
                    currentUrl,
                    query,
                    {
                        timeout: this.timeout,
                        headers: {
                            "Content-Type": "text/plain; charset=utf-8",
                            "User-Agent":
                                "ToiletFinder/1.0 (contact@example.com)",
                        },
                        maxContentLength: this.maxsize,
                        maxBodyLength: this.maxsize,
                    }
                );

                console.log(
                    `✅ Overpass API 응답 수신: ${response.data.elements.length}개 요소`
                );

                const toilets = this.parseOverpassResponse(
                    response.data,
                    userLocation
                );
                console.log(`🚽 파싱된 화장실: ${toilets.length}개`);

                return toilets;
            } catch (error) {
                console.error(`❌ 엔드포인트 ${currentUrl} 호출 실패:`, error);
                lastError = error;

                // 연결 타임아웃이나 네트워크 오류인 경우 다음 엔드포인트로 이동
                if (this.isNetworkError(error)) {
                    console.log(`🔄 다음 엔드포인트로 전환 중...`);
                    this.currentEndpointIndex =
                        (this.currentEndpointIndex + 1) % this.endpoints.length;
                } else {
                    // 다른 종류의 에러는 재시도하지 않음
                    throw error;
                }
            }
        }

        // 모든 엔드포인트 실패 시
        console.error("❌ 모든 Overpass API 엔드포인트 호출 실패");
        throw new Error(`모든 Overpass API 엔드포인트 호출 실패: ${lastError}`);
    }

    // 대규모 지역의 화장실 데이터 수집 (데이터베이스 저장용)
    async fetchToiletsInArea(
        area: {
            name: string;
            north: number;
            south: number;
            east: number;
            west: number;
        },
        maxResults: number = 10000
    ): Promise<Toilet[]> {
        console.log(`🗺️ 지역별 화장실 데이터 수집 시작: ${area.name}`);

        const query = this.buildAreaQuery(area, maxResults);

        try {
            console.log("📡 대규모 Overpass API 호출 중...");
            const currentUrl = this.endpoints[this.currentEndpointIndex];
            const response = await axios.post<OverpassResponse>(
                currentUrl,
                query,
                {
                    timeout: this.timeout * 3, // 3배 더 긴 타임아웃
                    headers: {
                        "Content-Type": "text/plain; charset=utf-8",
                        "User-Agent": "ToiletFinder/1.0 (contact@example.com)",
                    },
                    maxContentLength: this.maxsize,
                    maxBodyLength: this.maxsize,
                }
            );

            console.log(
                `✅ ${area.name} 지역 응답 수신: ${response.data.elements.length}개 요소`
            );

            const toilets = this.parseOverpassResponse(response.data);
            console.log(
                `🚽 ${area.name} 지역 화장실: ${toilets.length}개 파싱됨`
            );

            return toilets;
        } catch (error) {
            console.error(`❌ ${area.name} 지역 데이터 수집 실패:`, error);
            throw new Error(`Overpass API 호출 실패: ${error}`);
        }
    }

    // 전 세계 주요 도시의 화장실 데이터 수집
    async fetchAllMajorCitiesData(): Promise<Toilet[]> {
        const majorCities = [
            {
                name: "서울",
                north: 37.7,
                south: 37.4,
                east: 127.3,
                west: 126.7,
            },
            {
                name: "도쿄",
                north: 35.8,
                south: 35.5,
                east: 140.0,
                west: 139.5,
            },
            {
                name: "뉴욕",
                north: 40.9,
                south: 40.4,
                east: -73.7,
                west: -74.3,
            },
            { name: "런던", north: 51.7, south: 51.3, east: 0.3, west: -0.5 },
            { name: "파리", north: 48.95, south: 48.8, east: 2.5, west: 2.2 },
            {
                name: "베를린",
                north: 52.6,
                south: 52.4,
                east: 13.8,
                west: 13.1,
            },
        ];

        const allToilets: Toilet[] = [];

        for (const city of majorCities) {
            try {
                const cityToilets = await this.fetchToiletsInArea(city, 2000);
                allToilets.push(...cityToilets);

                // API 부하 방지를 위한 딜레이
                await this.delay(5000); // 5초 대기
            } catch (error) {
                console.error(`❌ ${city.name} 데이터 수집 실패:`, error);
                // 한 도시가 실패해도 계속 진행
            }
        }

        return allToilets;
    }

    private buildOverpassQuery(
        location: Location,
        radiusInMeters: number
    ): string {
        // 더 간단하고 효율적인 쿼리로 최적화
        return `[out:json][timeout:${Math.ceil(this.timeout / 1000)}];
(
  node["amenity"="toilets"](around:${radiusInMeters},${location.latitude},${
            location.longitude
        });
  way["amenity"="toilets"](around:${radiusInMeters},${location.latitude},${
            location.longitude
        });
);
out center;`.trim();
    }

    private buildAreaQuery(
        area: { north: number; south: number; east: number; west: number },
        maxResults: number
    ): string {
        return `
[out:json][timeout:${Math.ceil((this.timeout * 3) / 1000)}][maxsize:${
            this.maxsize
        }];
(
  nwr["amenity"="toilets"](${area.south},${area.west},${area.north},${
            area.east
        });
);
out center meta tags ${maxResults};
        `.trim();
    }

    private parseOverpassResponse(
        response: OverpassResponse,
        userLocation?: Location
    ): Toilet[] {
        const toilets: Toilet[] = [];

        for (const element of response.elements) {
            const toilet = this.parseElement(element);
            if (toilet) {
                toilets.push(toilet);
            }
        }

        // 사용자 위치가 있으면 거리순으로 정렬
        if (userLocation) {
            toilets.sort((a, b) => {
                const distA = this.calculateDistance(userLocation, {
                    latitude: a.latitude,
                    longitude: a.longitude,
                });
                const distB = this.calculateDistance(userLocation, {
                    latitude: b.latitude,
                    longitude: b.longitude,
                });
                return distA - distB;
            });
        }

        return toilets;
    }

    private parseElement(element: OverpassElement): Toilet | null {
        try {
            // center 좌표 또는 직접 좌표 사용
            const latitude = element.center?.lat || element.lat;
            const longitude = element.center?.lon || element.lon;

            if (!latitude || !longitude) {
                console.warn(
                    `⚠️ 좌표 정보 없음: ${element.type} ${element.id}`
                );
                return null;
            }

            const tags = element.tags || {};

            const toilet: Toilet = {
                id: `overpass_${element.type}_${element.id}`,
                name: this.extractName(tags),
                latitude,
                longitude,
                address: this.buildAddress(tags),
                type: this.determineToiletType(tags),
                accessibility: this.determineAccessibility(tags),
                operatingHours: this.extractOperatingHours(tags),
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            return toilet;
        } catch (error) {
            console.warn(
                `⚠️ 요소 파싱 실패: ${element.type} ${element.id}`,
                error
            );
            return null;
        }
    }

    private extractName(tags: Record<string, string>): string {
        return (
            tags.name ||
            tags["name:ko"] ||
            tags["name:en"] ||
            tags.operator ||
            tags.brand ||
            tags.building ||
            "공공 화장실"
        );
    }

    private extractOperatingHours(tags: Record<string, string>): string {
        return (
            tags.opening_hours ||
            tags["opening_hours:covid19"] ||
            tags.hours ||
            (tags["24/7"] === "yes" ? "24시간" : "영업시간 정보 없음")
        );
    }

    private buildAddress(tags: Record<string, string>): string {
        const addressParts: string[] = [];

        // 한국 주소 형식
        if (tags["addr:city"]) addressParts.push(tags["addr:city"]);
        if (tags["addr:district"]) addressParts.push(tags["addr:district"]);
        if (tags["addr:street"]) addressParts.push(tags["addr:street"]);
        if (tags["addr:housenumber"])
            addressParts.push(tags["addr:housenumber"]);

        // 국제 주소 형식
        if (addressParts.length === 0) {
            if (tags["addr:country"]) addressParts.push(tags["addr:country"]);
            if (tags["addr:state"]) addressParts.push(tags["addr:state"]);
            if (tags["addr:city"]) addressParts.push(tags["addr:city"]);
            if (tags["addr:street"]) addressParts.push(tags["addr:street"]);
        }

        // 기타 위치 정보
        if (addressParts.length === 0) {
            if (tags.place) addressParts.push(tags.place);
            if (tags.building) addressParts.push(tags.building);
            if (tags.level) addressParts.push(`${tags.level}층`);
        }

        return addressParts.length > 0
            ? addressParts.join(" ")
            : "주소 정보 없음";
    }

    private determineToiletType(tags: Record<string, string>): ToiletType {
        // 유료 화장실
        if (tags.fee === "yes" || tags.charge || tags.payment) {
            return ToiletType.COMMERCIAL;
        }

        // 접근 권한 확인
        if (
            tags.access === "private" ||
            tags.access === "customers" ||
            tags.access === "permissive"
        ) {
            return ToiletType.PRIVATE;
        }

        // 상업시설 내 화장실
        if (
            tags.operator?.match(
                /(마트|상점|백화점|쇼핑|mall|shop|store|market)/i
            ) ||
            tags.building?.match(/(commercial|retail|shop)/i)
        ) {
            return ToiletType.COMMERCIAL;
        }

        return ToiletType.PUBLIC;
    }

    private determineAccessibility(tags: Record<string, string>): boolean {
        return (
            tags.wheelchair === "yes" ||
            tags["wheelchair:access"] === "yes" ||
            tags.disabled === "yes" ||
            tags["disabled:access"] === "yes" ||
            tags.barrier_free === "yes" ||
            tags.handicapped === "yes"
        );
    }

    private calculateDistance(pos1: Location, pos2: Location): number {
        const R = 6371e3; // 지구 반지름 (미터)
        const φ1 = (pos1.latitude * Math.PI) / 180;
        const φ2 = (pos2.latitude * Math.PI) / 180;
        const Δφ = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
        const Δλ = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private isNetworkError(error: any): boolean {
        // 네트워크 관련 오류 확인
        return (
            error.code === "ETIMEDOUT" ||
            error.code === "ENETUNREACH" ||
            error.code === "ECONNREFUSED" ||
            error.code === "ENOTFOUND" ||
            (error.response && error.response.status >= 500) ||
            error.message?.includes("timeout") ||
            error.message?.includes("network")
        );
    }
}
