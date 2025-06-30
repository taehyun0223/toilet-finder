import { TokyoApiClient } from "@/infrastructure/external/tokyo-api-client";
import { ToiletPostgresRepository } from "@/infrastructure/database/toilet-postgres-repository";
import { Toilet } from "@/domain/entities/toilet";

export interface TokyoDataSyncResult {
    success: boolean;
    message: string;
    statistics: {
        total: number;
        saved: number;
        updated: number;
        failed: number;
        duration: number;
    };
    error?: string;
}

export class TokyoDataSyncUseCase {
    constructor(
        private tokyoApiClient: TokyoApiClient,
        private toiletRepository: ToiletPostgresRepository
    ) {}

    async syncTokyoData(): Promise<TokyoDataSyncResult> {
        const startTime = Date.now();
        console.log("🔄 도쿄 화장실 데이터 동기화 시작");

        try {
            // 1. 도쿄 API에서 최신 데이터 가져오기
            console.log("📡 도쿄 API에서 데이터 가져오는 중...");
            const toilets =
                await this.tokyoApiClient.fetchAllToiletsForDatabase();

            if (toilets.length === 0) {
                return {
                    success: false,
                    message: "도쿄 API에서 데이터를 가져올 수 없습니다",
                    statistics: {
                        total: 0,
                        saved: 0,
                        updated: 0,
                        failed: 0,
                        duration: Date.now() - startTime,
                    },
                };
            }

            // 2. 데이터베이스에 저장
            console.log(
                `💾 ${toilets.length}개 화장실 데이터를 데이터베이스에 저장 중...`
            );
            const saveResult = await this.toiletRepository.saveTokyoToilets(
                toilets
            );

            // 3. 결과 반환
            const duration = Date.now() - startTime;
            const successRate =
                ((saveResult.saved + saveResult.updated) / toilets.length) *
                100;

            console.log(`✅ 도쿄 데이터 동기화 완료 (소요시간: ${duration}ms)`);
            console.log(
                `📊 성공률: ${successRate.toFixed(1)}% (${
                    saveResult.saved + saveResult.updated
                }/${toilets.length})`
            );

            return {
                success: true,
                message: `도쿄 화장실 데이터 동기화 완료: 신규 ${saveResult.saved}개, 업데이트 ${saveResult.updated}개`,
                statistics: {
                    total: toilets.length,
                    saved: saveResult.saved,
                    updated: saveResult.updated,
                    failed: saveResult.failed,
                    duration,
                },
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage =
                error instanceof Error ? error.message : "알 수 없는 오류";

            console.error("❌ 도쿄 데이터 동기화 실패:", error);

            return {
                success: false,
                message: "도쿄 데이터 동기화 중 오류 발생",
                statistics: {
                    total: 0,
                    saved: 0,
                    updated: 0,
                    failed: 0,
                    duration,
                },
                error: errorMessage,
            };
        }
    }

    async getTokyoDataInfo() {
        try {
            // API 정보
            const syncInfo = await this.tokyoApiClient.getDataSyncInfo();

            // DB 통계
            const dbStats = await this.toiletRepository.getTokyoToiletStats();

            return {
                api: syncInfo,
                database: dbStats,
                needsSync: this.checkIfSyncNeeded(
                    syncInfo.lastUpdate,
                    dbStats.lastUpdated
                ),
            };
        } catch (error) {
            console.error("도쿄 데이터 정보 조회 실패:", error);
            throw error;
        }
    }

    private checkIfSyncNeeded(
        apiLastUpdate: Date | null,
        dbLastUpdate: Date | null
    ): boolean {
        // API 데이터가 없으면 동기화 불필요
        if (!apiLastUpdate) return false;

        // DB에 데이터가 없으면 동기화 필요
        if (!dbLastUpdate) return true;

        // DB가 API보다 오래되었으면 동기화 필요
        return dbLastUpdate < apiLastUpdate;
    }

    // 자동 동기화 (스케줄러용)
    async scheduleSync(): Promise<void> {
        console.log("⏰ 도쿄 데이터 자동 동기화 스케줄 시작");

        try {
            const info = await this.getTokyoDataInfo();

            if (info.needsSync) {
                console.log("🔄 동기화가 필요합니다. 동기화를 시작합니다...");
                await this.syncTokyoData();
            } else {
                console.log(
                    "✅ 데이터가 최신 상태입니다. 동기화를 건너뜁니다."
                );
            }
        } catch (error) {
            console.error("❌ 자동 동기화 실패:", error);
        }
    }

    // 데이터 정리 (오래된 데이터 삭제)
    async cleanupOldData(olderThanDays: number = 30): Promise<number> {
        console.log(`🧹 ${olderThanDays}일 이상 된 도쿄 데이터 정리 시작`);

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
}
