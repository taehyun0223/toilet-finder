import { Request, Response } from "express";
import { TokyoDataSyncUseCase } from "@/application/use-cases/tokyo-data-sync";

export class TokyoSyncController {
    constructor(private tokyoDataSyncUseCase: TokyoDataSyncUseCase) {}

    // 수동 데이터 동기화
    async syncData(req: Request, res: Response): Promise<void> {
        try {
            console.log("🔄 수동 도쿄 데이터 동기화 요청");

            const result = await this.tokyoDataSyncUseCase.syncTokyoData();

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
            console.error("❌ 동기화 컨트롤러 오류:", error);
            res.status(500).json({
                success: false,
                message: "데이터 동기화 중 서버 오류가 발생했습니다",
                error:
                    error instanceof Error ? error.message : "알 수 없는 오류",
            });
        }
    }

    // 도쿄 데이터 정보 조회
    async getDataInfo(req: Request, res: Response): Promise<void> {
        try {
            const info = await this.tokyoDataSyncUseCase.getTokyoDataInfo();

            res.status(200).json({
                success: true,
                data: {
                    api: {
                        lastUpdate: info.api.lastUpdate,
                        totalCount: info.api.totalCount,
                        source: info.api.source,
                    },
                    database: {
                        total: info.database.total,
                        accessible: info.database.accessible,
                        byType: info.database.byType,
                        lastUpdated: info.database.lastUpdated,
                    },
                    sync: {
                        needsSync: info.needsSync,
                        recommendation: info.needsSync
                            ? "데이터 동기화를 권장합니다"
                            : "데이터가 최신 상태입니다",
                    },
                },
            });
        } catch (error) {
            console.error("❌ 데이터 정보 조회 실패:", error);
            res.status(500).json({
                success: false,
                message: "데이터 정보 조회 중 오류가 발생했습니다",
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

            const deletedCount = await this.tokyoDataSyncUseCase.cleanupOldData(
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
            console.error("❌ 데이터 정리 실패:", error);
            res.status(500).json({
                success: false,
                message: "데이터 정리 중 오류가 발생했습니다",
                error:
                    error instanceof Error ? error.message : "알 수 없는 오류",
            });
        }
    }

    // 시스템 상태 및 통계
    async getSystemStats(req: Request, res: Response): Promise<void> {
        try {
            const info = await this.tokyoDataSyncUseCase.getTokyoDataInfo();

            // 시스템 상태 평가
            const systemHealth = this.evaluateSystemHealth(info);

            res.status(200).json({
                success: true,
                data: {
                    health: systemHealth,
                    statistics: info.database,
                    lastSync: info.api.lastUpdate,
                    recommendations: this.getRecommendations(
                        info,
                        systemHealth
                    ),
                },
            });
        } catch (error) {
            console.error("❌ 시스템 통계 조회 실패:", error);
            res.status(500).json({
                success: false,
                message: "시스템 통계 조회 중 오류가 발생했습니다",
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

        // 동기화가 필요함
        if (info.needsSync) {
            issues.push("API와 데이터베이스 간 동기화가 필요합니다");
            score -= 20;
        }

        // 오래된 데이터
        if (info.database.lastUpdated) {
            const daysSinceUpdate = Math.floor(
                (Date.now() - new Date(info.database.lastUpdated).getTime()) /
                    (1000 * 60 * 60 * 24)
            );

            if (daysSinceUpdate > 7) {
                issues.push(`마지막 업데이트가 ${daysSinceUpdate}일 전입니다`);
                score -= 15;
            }
        }

        // 접근성 정보 부족
        const accessibilityRate =
            info.database.total > 0
                ? (info.database.accessible / info.database.total) * 100
                : 0;

        if (accessibilityRate < 50) {
            issues.push("접근성 정보가 부족합니다");
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
            recommendations.push(
                "도쿄 API 데이터를 동기화하여 화장실 정보를 가져오세요"
            );
        }

        if (info.needsSync) {
            recommendations.push("최신 데이터를 위해 동기화를 실행하세요");
        }

        if (health.status === "critical") {
            recommendations.push(
                "시스템 상태가 심각합니다. 즉시 데이터 동기화를 실행하세요"
            );
        }

        if (recommendations.length === 0) {
            recommendations.push("시스템이 정상 상태입니다");
        }

        return recommendations;
    }
}
