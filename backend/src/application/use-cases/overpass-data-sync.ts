import { OverpassApiClient } from "@/infrastructure/external/overpass-api-client";
import { ToiletPostgresRepository } from "@/infrastructure/database/toilet-postgres-repository";
import { Toilet } from "@/domain/entities/toilet";

export interface OverpassDataSyncResult {
    success: boolean;
    message: string;
    statistics: {
        total: number;
        saved: number;
        updated: number;
        failed: number;
        duration: number;
        cities: string[];
    };
    error?: string;
}

export class OverpassDataSyncUseCase {
    constructor(
        private overpassApiClient: OverpassApiClient,
        private toiletRepository: ToiletPostgresRepository
    ) {}

    async syncOverpassData(): Promise<OverpassDataSyncResult> {
        const startTime = Date.now();
        console.log("🌍 Overpass 화장실 데이터 동기화 시작");

        try {
            // 1. Overpass API에서 전 세계 주요 도시 데이터 가져오기
            console.log("📡 Overpass API에서 전 세계 데이터 가져오는 중...");
            const toilets =
                await this.overpassApiClient.fetchAllMajorCitiesData();

            if (toilets.length === 0) {
                return {
                    success: false,
                    message: "Overpass API에서 데이터를 가져올 수 없습니다",
                    statistics: {
                        total: 0,
                        saved: 0,
                        updated: 0,
                        failed: 0,
                        duration: Date.now() - startTime,
                        cities: [],
                    },
                };
            }

            // 2. 데이터 품질 검증 및 필터링
            const validToilets = this.validateAndFilterToilets(toilets);
            console.log(
                `✅ 유효한 화장실 데이터: ${validToilets.length}개 (전체 ${toilets.length}개 중)`
            );

            // 3. 데이터베이스에 저장
            console.log(
                `💾 ${validToilets.length}개 화장실 데이터를 데이터베이스에 저장 중...`
            );
            const saveResult = await this.toiletRepository.saveTokyoToilets(
                validToilets
            );

            // 4. 결과 반환
            const duration = Date.now() - startTime;
            const successRate =
                ((saveResult.saved + saveResult.updated) /
                    validToilets.length) *
                100;

            const cities = this.extractCitiesFromToilets(validToilets);

            console.log(
                `✅ Overpass 데이터 동기화 완료 (소요시간: ${duration}ms)`
            );
            console.log(
                `📊 성공률: ${successRate.toFixed(1)}% (${
                    saveResult.saved + saveResult.updated
                }/${validToilets.length})`
            );

            return {
                success: true,
                message: `Overpass 화장실 데이터 동기화 완료: 신규 ${saveResult.saved}개, 업데이트 ${saveResult.updated}개`,
                statistics: {
                    total: validToilets.length,
                    saved: saveResult.saved,
                    updated: saveResult.updated,
                    failed: saveResult.failed,
                    duration,
                    cities,
                },
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage =
                error instanceof Error ? error.message : "알 수 없는 오류";

            console.error("❌ Overpass 데이터 동기화 실패:", error);

            return {
                success: false,
                message: "Overpass 데이터 동기화 중 오류 발생",
                statistics: {
                    total: 0,
                    saved: 0,
                    updated: 0,
                    failed: 0,
                    duration,
                    cities: [],
                },
                error: errorMessage,
            };
        }
    }

    // 특정 지역의 화장실 데이터 동기화
    async syncSpecificArea(
        areaName: string,
        north: number,
        south: number,
        east: number,
        west: number,
        maxResults: number = 5000
    ): Promise<OverpassDataSyncResult> {
        const startTime = Date.now();
        console.log(`🗺️ ${areaName} 지역 화장실 데이터 동기화 시작`);

        try {
            const area = { name: areaName, north, south, east, west };
            const toilets = await this.overpassApiClient.fetchToiletsInArea(
                area,
                maxResults
            );

            if (toilets.length === 0) {
                return {
                    success: false,
                    message: `${areaName} 지역에서 화장실 데이터를 찾을 수 없습니다`,
                    statistics: {
                        total: 0,
                        saved: 0,
                        updated: 0,
                        failed: 0,
                        duration: Date.now() - startTime,
                        cities: [areaName],
                    },
                };
            }

            const validToilets = this.validateAndFilterToilets(toilets);
            const saveResult = await this.toiletRepository.saveTokyoToilets(
                validToilets
            );

            const duration = Date.now() - startTime;

            return {
                success: true,
                message: `${areaName} 지역 동기화 완료: 신규 ${saveResult.saved}개, 업데이트 ${saveResult.updated}개`,
                statistics: {
                    total: validToilets.length,
                    saved: saveResult.saved,
                    updated: saveResult.updated,
                    failed: saveResult.failed,
                    duration,
                    cities: [areaName],
                },
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage =
                error instanceof Error ? error.message : "알 수 없는 오류";

            console.error(`❌ ${areaName} 지역 동기화 실패:`, error);

            return {
                success: false,
                message: `${areaName} 지역 동기화 중 오류 발생`,
                statistics: {
                    total: 0,
                    saved: 0,
                    updated: 0,
                    failed: 0,
                    duration,
                    cities: [areaName],
                },
                error: errorMessage,
            };
        }
    }

    async getOverpassDataInfo() {
        try {
            // DB 통계
            const dbStats = await this.toiletRepository.getTokyoToiletStats();

            return {
                source: "Overpass API (OpenStreetMap)",
                database: dbStats,
                lastSync: dbStats.lastUpdated,
                coverage: "전 세계 주요 도시",
                supportedCities: [
                    "서울",
                    "도쿄",
                    "뉴욕",
                    "런던",
                    "파리",
                    "베를린",
                ],
            };
        } catch (error) {
            console.error("Overpass 데이터 정보 조회 실패:", error);
            throw error;
        }
    }

    // 자동 동기화 (스케줄러용)
    async scheduleSync(): Promise<void> {
        console.log("⏰ Overpass 데이터 자동 동기화 스케줄 시작");

        try {
            const info = await this.getOverpassDataInfo();

            // 데이터가 없거나 오래되었으면 동기화
            const needsSync = this.checkIfSyncNeeded(info.lastSync);

            if (needsSync) {
                console.log("🔄 동기화가 필요합니다. 동기화를 시작합니다...");
                await this.syncOverpassData();
            } else {
                console.log(
                    "✅ 데이터가 최신 상태입니다. 동기화를 건너뜁니다."
                );
            }
        } catch (error) {
            console.error("❌ Overpass 자동 동기화 실패:", error);
        }
    }

    // 데이터 정리 (오래된 데이터 삭제)
    async cleanupOldData(olderThanDays: number = 30): Promise<number> {
        console.log(`🧹 ${olderThanDays}일 이상 된 Overpass 데이터 정리 시작`);

        try {
            const deletedCount =
                await this.toiletRepository.cleanupOldTokyoData(olderThanDays);
            console.log(
                `✅ ${deletedCount}개의 오래된 데이터가 정리되었습니다`
            );
            return deletedCount;
        } catch (error) {
            console.error("❌ 데이터 정리 실패:", error);
            throw error;
        }
    }

    private validateAndFilterToilets(toilets: Toilet[]): Toilet[] {
        return toilets.filter((toilet) => {
            // 기본 검증
            if (
                !toilet.latitude ||
                !toilet.longitude ||
                !toilet.name ||
                toilet.name.trim() === ""
            ) {
                return false;
            }

            // 좌표 범위 검증
            if (
                toilet.latitude < -90 ||
                toilet.latitude > 90 ||
                toilet.longitude < -180 ||
                toilet.longitude > 180
            ) {
                return false;
            }

            // 중복 이름 필터링 (너무 일반적인 이름 제외)
            const genericNames = [
                "화장실",
                "toilet",
                "restroom",
                "wc",
                "public toilet",
            ];
            if (genericNames.includes(toilet.name.toLowerCase())) {
                // 주소가 있으면 허용
                return toilet.address && toilet.address !== "주소 정보 없음";
            }

            return true;
        });
    }

    private extractCitiesFromToilets(toilets: Toilet[]): string[] {
        const cities = new Set<string>();

        toilets.forEach((toilet) => {
            // ID에서 도시 정보 추출 (overpass_node_123 형태)
            if (toilet.address && toilet.address !== "주소 정보 없음") {
                // 주소에서 도시명 추출 시도
                const addressParts = toilet.address.split(" ");
                if (addressParts.length > 0) {
                    cities.add(addressParts[0]);
                }
            }
        });

        return Array.from(cities).slice(0, 10); // 상위 10개 도시만 반환
    }

    private checkIfSyncNeeded(lastSync: Date | null): boolean {
        // 데이터가 없으면 동기화 필요
        if (!lastSync) return true;

        // 24시간 이상 지났으면 동기화 필요
        const daysSinceSync =
            (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceSync >= 1;
    }
}
