import { Request, Response } from "express";
import { OverpassDataSyncUseCase } from "@/application/use-cases/overpass-data-sync";

export class OverpassSyncController {
    constructor(private overpassDataSyncUseCase: OverpassDataSyncUseCase) {}

    // 전체 데이터 동기화
    async syncData(req: Request, res: Response): Promise<void> {
        try {
            console.log("🌍 수동 Overpass 데이터 동기화 요청");

            const result =
                await this.overpassDataSyncUseCase.syncOverpassData();

            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.statistics,
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.message,
                    error: result.error,
                });
            }
        } catch (error) {
            console.error("❌ Overpass 동기화 컨트롤러 오류:", error);
            res.status(500).json({
                success: false,
                message: "Overpass 데이터 동기화 중 서버 오류가 발생했습니다",
                error:
                    error instanceof Error ? error.message : "알 수 없는 오류",
            });
        }
    }

    // 특정 지역 데이터 동기화
    async syncSpecificArea(req: Request, res: Response): Promise<void> {
        try {
            const {
                areaName,
                north,
                south,
                east,
                west,
                maxResults = 5000,
            } = req.body;

            // 입력 값 검증
            if (
                !areaName ||
                typeof north !== "number" ||
                typeof south !== "number" ||
                typeof east !== "number" ||
                typeof west !== "number"
            ) {
                res.status(400).json({
                    success: false,
                    message:
                        "필수 파라미터가 누락되었습니다. (areaName, north, south, east, west)",
                });
                return;
            }

            // 좌표 범위 검증
            if (north <= south || east <= west) {
                res.status(400).json({
                    success: false,
                    message:
                        "올바르지 않은 좌표 범위입니다. (north > south, east > west)",
                });
                return;
            }

            console.log(`🗺️ 특정 지역 동기화 요청: ${areaName}`);

            const result = await this.overpassDataSyncUseCase.syncSpecificArea(
                areaName,
                north,
                south,
                east,
                west,
                parseInt(maxResults)
            );

            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.statistics,
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.message,
                    error: result.error,
                });
            }
        } catch (error) {
            console.error("❌ 특정 지역 동기화 실패:", error);
            res.status(500).json({
                success: false,
                message: "특정 지역 동기화 중 서버 오류가 발생했습니다",
                error:
                    error instanceof Error ? error.message : "알 수 없는 오류",
            });
        }
    }

    // Overpass 데이터 정보 조회
    async getDataInfo(req: Request, res: Response): Promise<void> {
        try {
            const info =
                await this.overpassDataSyncUseCase.getOverpassDataInfo();

            res.status(200).json({
                success: true,
                data: {
                    source: info.source,
                    coverage: info.coverage,
                    supportedCities: info.supportedCities,
                    database: {
                        total: info.database.total,
                        accessible: info.database.accessible,
                        byType: info.database.byType,
                        lastUpdated: info.database.lastUpdated,
                    },
                    sync: {
                        lastSync: info.lastSync,
                        recommendation: info.lastSync
                            ? "정기적인 데이터 동기화를 권장합니다"
                            : "초기 데이터 동기화가 필요합니다",
                    },
                },
            });
        } catch (error) {
            console.error("❌ Overpass 데이터 정보 조회 실패:", error);
            res.status(500).json({
                success: false,
                message: "Overpass 데이터 정보 조회 중 오류가 발생했습니다",
                error:
                    error instanceof Error ? error.message : "알 수 없는 오류",
            });
        }
    }

    // 오래된 데이터 정리
    async cleanupOldData(req: Request, res: Response): Promise<void> {
        try {
            const { days = 30 } = req.query;
            const olderThanDays = parseInt(days as string, 10);

            if (isNaN(olderThanDays) || olderThanDays < 1) {
                res.status(400).json({
                    success: false,
                    message:
                        "유효하지 않은 일수입니다. 1 이상의 숫자를 입력해주세요.",
                });
                return;
            }

            const deletedCount =
                await this.overpassDataSyncUseCase.cleanupOldData(
                    olderThanDays
                );

            res.status(200).json({
                success: true,
                message: `${olderThanDays}일 이상 된 데이터 ${deletedCount}개가 정리되었습니다`,
                data: {
                    deletedCount,
                    olderThanDays,
                },
            });
        } catch (error) {
            console.error("❌ Overpass 데이터 정리 실패:", error);
            res.status(500).json({
                success: false,
                message: "Overpass 데이터 정리 중 오류가 발생했습니다",
                error:
                    error instanceof Error ? error.message : "알 수 없는 오류",
            });
        }
    }

    // 시스템 상태 및 통계
    async getSystemStats(req: Request, res: Response): Promise<void> {
        try {
            const info =
                await this.overpassDataSyncUseCase.getOverpassDataInfo();

            // 시스템 상태 평가
            const systemHealth = this.evaluateSystemHealth(info);

            res.status(200).json({
                success: true,
                data: {
                    health: systemHealth,
                    source: info.source,
                    coverage: info.coverage,
                    supportedCities: info.supportedCities,
                    statistics: info.database,
                    lastSync: info.lastSync,
                    recommendations: this.getRecommendations(
                        info,
                        systemHealth
                    ),
                },
            });
        } catch (error) {
            console.error("❌ Overpass 시스템 통계 조회 실패:", error);
            res.status(500).json({
                success: false,
                message: "Overpass 시스템 통계 조회 중 오류가 발생했습니다",
                error:
                    error instanceof Error ? error.message : "알 수 없는 오류",
            });
        }
    }

    // 지원되는 도시 목록 조회
    async getSupportedCities(req: Request, res: Response): Promise<void> {
        try {
            const cities = [
                {
                    name: "서울",
                    country: "대한민국",
                    bounds: {
                        north: 37.7,
                        south: 37.4,
                        east: 127.3,
                        west: 126.7,
                    },
                },
                {
                    name: "도쿄",
                    country: "일본",
                    bounds: {
                        north: 35.8,
                        south: 35.5,
                        east: 140.0,
                        west: 139.5,
                    },
                },
                {
                    name: "뉴욕",
                    country: "미국",
                    bounds: {
                        north: 40.9,
                        south: 40.4,
                        east: -73.7,
                        west: -74.3,
                    },
                },
                {
                    name: "런던",
                    country: "영국",
                    bounds: { north: 51.7, south: 51.3, east: 0.3, west: -0.5 },
                },
                {
                    name: "파리",
                    country: "프랑스",
                    bounds: { north: 48.95, south: 48.8, east: 2.5, west: 2.2 },
                },
                {
                    name: "베를린",
                    country: "독일",
                    bounds: {
                        north: 52.6,
                        south: 52.4,
                        east: 13.8,
                        west: 13.1,
                    },
                },
            ];

            res.status(200).json({
                success: true,
                data: {
                    cities,
                    total: cities.length,
                    note: "사용자 정의 지역도 좌표 범위를 제공하여 동기화 가능합니다",
                },
            });
        } catch (error) {
            console.error("❌ 지원 도시 목록 조회 실패:", error);
            res.status(500).json({
                success: false,
                message: "지원 도시 목록 조회 중 오류가 발생했습니다",
                error:
                    error instanceof Error ? error.message : "알 수 없는 오류",
            });
        }
    }

    private evaluateSystemHealth(info: any): {
        status: "healthy" | "warning" | "critical";
        score: number;
        issues: string[];
    } {
        const issues: string[] = [];
        let score = 100;

        // 데이터베이스에 데이터가 없음
        if (info.database.total === 0) {
            issues.push("데이터베이스에 화장실 데이터가 없습니다");
            score -= 50;
        }

        // 오래된 데이터
        if (info.lastSync) {
            const daysSinceUpdate = Math.floor(
                (Date.now() - new Date(info.lastSync).getTime()) /
                    (1000 * 60 * 60 * 24)
            );

            if (daysSinceUpdate > 7) {
                issues.push(`마지막 동기화가 ${daysSinceUpdate}일 전입니다`);
                score -= 20;
            }
        } else {
            issues.push("초기 데이터 동기화가 필요합니다");
            score -= 30;
        }

        // 접근성 정보 부족
        const accessibilityRate =
            info.database.total > 0
                ? (info.database.accessible / info.database.total) * 100
                : 0;

        if (accessibilityRate < 30) {
            issues.push("접근성 정보가 부족합니다");
            score -= 15;
        }

        // 데이터 품질 검사 (타입별 분포)
        const typeDistribution = info.database.byType;
        const publicRatio = typeDistribution?.PUBLIC || 0;
        const totalNonZero = Object.values(typeDistribution || {}).reduce(
            (sum: number, count: any) => sum + count,
            0
        );

        if (totalNonZero > 0 && publicRatio / totalNonZero < 0.5) {
            issues.push("공공 화장실 비율이 낮습니다");
            score -= 10;
        }

        let status: "healthy" | "warning" | "critical";
        if (score >= 80) status = "healthy";
        else if (score >= 60) status = "warning";
        else status = "critical";

        return { status, score: Math.max(0, score), issues };
    }

    private getRecommendations(info: any, health: any): string[] {
        const recommendations: string[] = [];

        if (info.database.total === 0) {
            recommendations.push("초기 데이터 동기화를 실행하세요");
        }

        if (health.score < 80) {
            recommendations.push(
                "시스템 상태를 개선하기 위해 데이터 동기화를 권장합니다"
            );
        }

        if (info.lastSync) {
            const daysSinceSync = Math.floor(
                (Date.now() - new Date(info.lastSync).getTime()) /
                    (1000 * 60 * 60 * 24)
            );

            if (daysSinceSync >= 7) {
                recommendations.push("주간 데이터 동기화를 설정하세요");
            }
        }

        if (info.database.total > 1000) {
            recommendations.push("오래된 데이터 정리를 고려해보세요");
        }

        return recommendations;
    }
}
