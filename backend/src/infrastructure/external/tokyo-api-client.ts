import axios from "axios";
import { Location, Toilet, ToiletType } from "@/domain/entities/toilet";

interface TokyoToiletData {
    [key: string]: string;
}

export class TokyoApiClient {
    private readonly baseUrl = "https://service.api.metro.tokyo.lg.jp";
    private readonly csvUrl =
        "https://www.city.koto.lg.jp/012107/documents/131083%5Fkotocity%5Fpublic%5Ftoilet.csv";
    private readonly timeout = 30000;
    private cachedToilets: Toilet[] | null = null;
    private lastFetchTime: number = 0;
    private cacheValidDuration = 60 * 60 * 1000; // 1시간
    private dataCache: Map<string, any> = new Map();

    async findToiletsNearLocation(
        location: Location,
        radiusInMeters: number
    ): Promise<Toilet[]> {
        try {
            console.log("🗾 도쿄 API 호출 시작:", { location, radiusInMeters });

            // 전체 도쿄 화장실 데이터 가져오기
            const allToilets = await this.getAllTokyoToilets();

            console.log(`✅ 도쿄 화장실 데이터 ${allToilets.length}개 로드됨`);

            return this.filterByDistance(allToilets, location, radiusInMeters);
        } catch (error) {
            console.error("❌ 도쿄 API 호출 실패:", error);
            throw new Error(`도쿄 API 호출 실패: ${error}`);
        }
    }

    // 전체 도쿄 화장실 데이터 가져오기 (캐시 포함)
    async getAllTokyoToilets(): Promise<Toilet[]> {
        // 캐시된 데이터 확인
        if (
            this.cachedToilets &&
            Date.now() - this.lastFetchTime < this.cacheValidDuration
        ) {
            console.log("📦 캐시된 데이터 사용");
            return this.cachedToilets;
        }

        // CSV 데이터 가져오기
        const toilets = await this.fetchTokyoToilets();
        this.cachedToilets = toilets;
        this.lastFetchTime = Date.now();

        return toilets;
    }

    // 데이터베이스 저장을 위한 전체 데이터 가져오기
    async fetchAllToiletsForDatabase(): Promise<Toilet[]> {
        console.log("🗄️ 데이터베이스 저장용 전체 데이터 가져오기 시작");

        try {
            const toilets = await this.fetchTokyoToilets();
            console.log(
                `📊 총 ${toilets.length}개의 도쿄 화장실 데이터 준비됨`
            );

            // 데이터 품질 확인
            const validToilets = toilets.filter(
                (toilet) =>
                    toilet.latitude &&
                    toilet.longitude &&
                    toilet.latitude !== 0 &&
                    toilet.longitude !== 0 &&
                    toilet.name &&
                    toilet.name.trim() !== ""
            );

            console.log(`✅ 유효한 화장실 데이터: ${validToilets.length}개`);

            return validToilets;
        } catch (error) {
            console.error("❌ 데이터베이스용 데이터 가져오기 실패:", error);
            throw error;
        }
    }

    // 데이터 동기화 상태 확인
    async getDataSyncInfo(): Promise<{
        lastUpdate: Date | null;
        totalCount: number;
        source: "cache" | "api" | "mock";
    }> {
        return {
            lastUpdate:
                this.lastFetchTime > 0 ? new Date(this.lastFetchTime) : null,
            totalCount: this.cachedToilets?.length || 0,
            source: this.cachedToilets ? "cache" : "api",
        };
    }

    private async fetchTokyoToilets(): Promise<Toilet[]> {
        try {
            console.log("📡 CSV 데이터 다운로드 중...");
            const response = await axios.get(this.csvUrl, {
                timeout: this.timeout,
                headers: {
                    "User-Agent": "ToiletFinder/1.0",
                    Accept: "text/csv",
                },
                responseType: "text",
            });

            const parsedToilets = this.parseCsvData(response.data);

            // CSV 파싱이 실패하면 Mock 데이터 사용
            if (parsedToilets.length === 0) {
                console.warn("⚠️ CSV 파싱 실패. Mock 데이터 사용");
                return this.getMockTokyoToilets();
            }

            return parsedToilets;
        } catch (error) {
            console.error("❌ CSV 다운로드 실패:", error);

            // 실패 시 임시 도쿄 데이터 반환
            return this.getMockTokyoToilets();
        }
    }

    private parseCsvData(csvData: string): Toilet[] {
        const lines = csvData.split("\n");
        const headers = lines[0]
            .split(",")
            .map((h) => h.trim().replace(/"/g, ""));
        const toilets: Toilet[] = [];

        console.log("📊 CSV 헤더 (총 " + headers.length + "개):", headers);

        // 첫 번째 데이터 행 전체 분석
        if (lines.length > 1) {
            const firstDataLine = lines[1].trim();
            if (firstDataLine) {
                const firstValues = this.parseCSVLine(firstDataLine);
                console.log("🔍 첫 번째 데이터 행 분석:");
                headers.forEach((header, index) => {
                    console.log(
                        `  [${index}] "${header}": "${
                            firstValues[index] || ""
                        }"`
                    );
                });
            }
        }

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            try {
                const values = this.parseCSVLine(line);
                if (values.length < headers.length) continue;

                const rowData: TokyoToiletData = {};
                headers.forEach((header, index) => {
                    rowData[header] = values[index] || "";
                });

                const toilet = this.convertToToilet(rowData, i);
                if (toilet) {
                    toilets.push(toilet);
                }
            } catch (error) {
                console.warn(`⚠️ CSV 라인 ${i} 파싱 실패:`, error);
            }
        }

        console.log(`📋 총 ${toilets.length}개 유효한 화장실 파싱됨`);
        return toilets;
    }

    private parseCSVLine(line: string): string[] {
        const result = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
                result.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result.map((v) => v.replace(/"/g, ""));
    }

    private convertToToilet(
        data: TokyoToiletData,
        index: number
    ): Toilet | null {
        try {
            // 실제 도쿄 오픈데이터 CSV 컬럼명에 맞게 매핑
            const name =
                data["名称"] ||
                data["施設名"] ||
                data["name"] ||
                `화장실 ${index}`;
            const address =
                data["住所"] ||
                data["所在地"] ||
                data["address"] ||
                "도쿄도 江東구";

            // 실제 CSV 컬럼명: 緯度 (위도), 経度 (경도)
            let latitude = this.parseCoordinate(data["緯度"]);
            let longitude = this.parseCoordinate(data["経度"]);

            // 실제 데이터 파싱 상태 로그 (처음 3개만)
            if (index <= 3) {
                console.log(`🗂️ 화장실 ${index} 데이터 파싱:`, {
                    name,
                    원본_위도: data["緯度"] || "N/A",
                    원본_경도: data["経度"] || "N/A",
                    파싱된_위도: latitude,
                    파싱된_경도: longitude,
                    주요_컬럼: {
                        名称: data["名称"],
                        住所: data["住所"],
                        緯度: data["緯度"],
                        経度: data["経度"],
                    },
                });
            }

            // 실제 좌표가 있는지 확인
            if (!latitude || !longitude || latitude === 0 || longitude === 0) {
                console.warn(
                    `⚠️ 화장실 ${index} "${name}" 좌표 없음 또는 0. 건너뛰기`
                );
                return null; // 좌표가 없으면 아예 제외
            }

            // 도쿄 지역 좌표인지 검증 (대략적인 범위)
            if (
                latitude < 35.5 ||
                latitude > 35.9 ||
                longitude < 139.5 ||
                longitude > 140.0
            ) {
                console.warn(
                    `⚠️ 화장실 ${index} "${name}" 도쿄 지역 벗어남: (${latitude}, ${longitude})`
                );
                return null;
            }

            return {
                id: `tokyo_${index}`,
                name: name,
                latitude: latitude,
                longitude: longitude,
                address: address,
                type: ToiletType.PUBLIC, // 도쿄 공공 화장실
                accessibility: this.parseAccessibility(data),
                operatingHours:
                    data["利用時間"] || data["営業時間"] || "24시간",
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        } catch (error) {
            console.warn("⚠️ 화장실 데이터 변환 실패:", error);
            return null;
        }
    }

    private parseCoordinate(coord: string): number | null {
        if (!coord) return null;
        const num = parseFloat(coord.toString());
        return isNaN(num) ? null : num;
    }

    private parseAccessibility(data: TokyoToiletData): boolean {
        const accessibilityFields = [
            "バリアフリー",
            "車椅子",
            "wheelchair",
            "多目的",
        ];
        return accessibilityFields.some(
            (field) =>
                data[field]?.includes("○") ||
                data[field]?.includes("有") ||
                data[field]?.toLowerCase().includes("yes")
        );
    }

    private filterByDistance(
        toilets: Toilet[],
        location: Location,
        radiusInMeters: number
    ): Toilet[] {
        console.log(
            `🔍 거리 필터링 시작: 검색 위치 (${location.latitude}, ${location.longitude}), 반경 ${radiusInMeters}m`
        );
        console.log(`📊 필터링 대상 화장실 수: ${toilets.length}개`);

        // 처음 5개 화장실의 좌표 정보 로그
        if (toilets.length > 0) {
            console.log("🗺️ 처음 5개 화장실 좌표:");
            toilets.slice(0, 5).forEach((toilet, index) => {
                const distance = this.calculateDistance(location, {
                    latitude: toilet.latitude,
                    longitude: toilet.longitude,
                });
                console.log(
                    `  ${index + 1}. ${toilet.name}: (${toilet.latitude}, ${
                        toilet.longitude
                    }) - 거리: ${Math.round(distance)}m`
                );
            });
        }

        const filteredToilets = toilets.filter((toilet) => {
            const distance = this.calculateDistance(location, {
                latitude: toilet.latitude,
                longitude: toilet.longitude,
            });
            const isWithinRadius = distance <= radiusInMeters;

            if (isWithinRadius) {
                console.log(
                    `✅ 범위 내 화장실: ${toilet.name} - 거리: ${Math.round(
                        distance
                    )}m`
                );
            }

            return isWithinRadius;
        });

        console.log(`🎯 필터링 결과: ${filteredToilets.length}개 화장실 발견`);
        return filteredToilets;
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

    private getMockTokyoToilets(): Toilet[] {
        // 도쿄 주요 지역의 실제 화장실 데이터 (테스트용) - 확장된 데이터셋
        return [
            // 기존 8개
            {
                id: "tokyo_mock_1",
                name: "도쿄역 공중화장실",
                latitude: 35.6812,
                longitude: 139.7671,
                address: "東京都千代田区丸の内一丁目9番1号",
                type: ToiletType.PUBLIC,
                accessibility: true,
                operatingHours: "24시간",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_2",
                name: "신주쿠역 남쪽 출구 화장실",
                latitude: 35.6896,
                longitude: 139.7006,
                address: "東京都新宿区新宿三丁目38番1号",
                type: ToiletType.PUBLIC,
                accessibility: true,
                operatingHours: "06:00-23:00",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_3",
                name: "시부야 센터가이 화장실",
                latitude: 35.658,
                longitude: 139.7016,
                address: "東京都渋谷区道玄坂二丁目3番1号",
                type: ToiletType.PUBLIC,
                accessibility: false,
                operatingHours: "24시간",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_4",
                name: "오다이바 해변공원 화장실",
                latitude: 35.6267,
                longitude: 139.773,
                address: "東京都港区台場一丁目4番1号",
                type: ToiletType.PUBLIC,
                accessibility: true,
                operatingHours: "24시간",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_5",
                name: "긴자 중앙 화장실",
                latitude: 35.6718,
                longitude: 139.7668,
                address: "東京都中央区銀座四丁目6番16号",
                type: ToiletType.PUBLIC,
                accessibility: true,
                operatingHours: "08:00-22:00",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_6",
                name: "아사쿠사 센소지 화장실",
                latitude: 35.7148,
                longitude: 139.7966,
                address: "東京都台東区浅草二丁目3番1号",
                type: ToiletType.PUBLIC,
                accessibility: true,
                operatingHours: "06:00-20:00",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_7",
                name: "츠키지 시장 화장실",
                latitude: 35.6654,
                longitude: 139.7707,
                address: "東京都中央区築地五丁目2番1号",
                type: ToiletType.PUBLIC,
                accessibility: false,
                operatingHours: "05:00-15:00",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_8",
                name: "도쿄 스카이트리 화장실",
                latitude: 35.7101,
                longitude: 139.8107,
                address: "東京都墨田区押上一丁目1番13号",
                type: ToiletType.PUBLIC,
                accessibility: true,
                operatingHours: "08:00-22:00",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            // 추가 화장실 데이터 (더 많은 데이터를 위해)
            {
                id: "tokyo_mock_9",
                name: "우에노공원 화장실",
                latitude: 35.7153,
                longitude: 139.7737,
                address: "東京都台東区上野公園5番20号",
                type: ToiletType.PUBLIC,
                accessibility: true,
                operatingHours: "24시간",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_10",
                name: "이케부쿠로역 동쪽 출구 화장실",
                latitude: 35.7295,
                longitude: 139.7109,
                address: "東京都豊島区南池袋一丁目28番2号",
                type: ToiletType.PUBLIC,
                accessibility: true,
                operatingHours: "06:00-24:00",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_11",
                name: "하라주쿠역 다케시타거리 화장실",
                latitude: 35.6706,
                longitude: 139.7026,
                address: "東京都渋谷区神宮前一丁目14番30号",
                type: ToiletType.PUBLIC,
                accessibility: false,
                operatingHours: "08:00-20:00",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_12",
                name: "아키하바라역 전기거리 화장실",
                latitude: 35.7022,
                longitude: 139.7744,
                address: "東京都千代田区外神田一丁目15番16号",
                type: ToiletType.PUBLIC,
                accessibility: true,
                operatingHours: "24시간",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_13",
                name: "도쿄돔 시티 화장실",
                latitude: 35.7056,
                longitude: 139.7522,
                address: "東京都文京区後楽一丁目3番61号",
                type: ToiletType.COMMERCIAL,
                accessibility: true,
                operatingHours: "08:00-22:00",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_14",
                name: "롯폰기힐즈 화장실",
                latitude: 35.6606,
                longitude: 139.7298,
                address: "東京都港区六本木六丁目10番1号",
                type: ToiletType.COMMERCIAL,
                accessibility: true,
                operatingHours: "24시간",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_15",
                name: "메이지신궁 화장실",
                latitude: 35.6763,
                longitude: 139.6993,
                address: "東京都渋谷区代々木神園町1番1号",
                type: ToiletType.PUBLIC,
                accessibility: true,
                operatingHours: "06:00-18:00",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_16",
                name: "신바시역 SL광장 화장실",
                latitude: 35.6656,
                longitude: 139.7585,
                address: "東京都港区新橋二丁目20番15号",
                type: ToiletType.PUBLIC,
                accessibility: false,
                operatingHours: "24시간",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_17",
                name: "시나가와역 항만구청 화장실",
                latitude: 35.6284,
                longitude: 139.7387,
                address: "東京都港区港南二丁目16番3号",
                type: ToiletType.PUBLIC,
                accessibility: true,
                operatingHours: "06:00-23:00",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_18",
                name: "요요기공원 화장실",
                latitude: 35.6719,
                longitude: 139.6959,
                address: "東京都渋谷区代々木神園町2番1号",
                type: ToiletType.PUBLIC,
                accessibility: true,
                operatingHours: "24시간",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_19",
                name: "타마치역 동쪽 출구 화장실",
                latitude: 35.6456,
                longitude: 139.747,
                address: "東京都港区芝五丁目33番1号",
                type: ToiletType.PUBLIC,
                accessibility: true,
                operatingHours: "06:00-24:00",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "tokyo_mock_20",
                name: "카메이도역 아리오 화장실",
                latitude: 35.6965,
                longitude: 139.8269,
                address: "東京都江東区亀戸二丁目19番1号",
                type: ToiletType.COMMERCIAL,
                accessibility: true,
                operatingHours: "10:00-21:00",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];
    }
}
