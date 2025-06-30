import { Pool } from "pg";
import { ToiletRepository } from "@/domain/repositories/toilet-repository";
import {
    Toilet,
    ToiletWithDistance,
    Location,
    ToiletType,
} from "@/domain/entities/toilet";
import { DistanceCalculator } from "@/domain/services/distance-calculator";

export class ToiletPostgresRepository implements ToiletRepository {
    constructor(private pool: Pool) {}

    async findNearbyToilets(
        location: Location,
        radiusInMeters: number
    ): Promise<ToiletWithDistance[]> {
        const query = `
            SELECT *,
                   ST_DistanceSphere(
                       ST_MakePoint(longitude, latitude),
                       ST_MakePoint($1, $2)
                   ) as distance
            FROM toilets
            WHERE ST_DistanceSphere(
                ST_MakePoint(longitude, latitude),
                ST_MakePoint($1, $2)
            ) <= $3
            ORDER BY distance
        `;

        try {
            const result = await this.pool.query(query, [
                location.longitude,
                location.latitude,
                radiusInMeters,
            ]);

            return result.rows.map((row) => ({
                id: row.id,
                name: row.name,
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                address: row.address,
                type: row.type,
                accessibility: row.accessibility,
                operatingHours: row.operating_hours,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
                distance: parseFloat(row.distance),
            }));
        } catch (error) {
            console.error("화장실 검색 실패:", error);
            throw new Error("화장실 검색 중 오류가 발생했습니다.");
        }
    }

    async findById(id: string): Promise<Toilet | null> {
        const query = "SELECT * FROM toilets WHERE id = $1";

        try {
            const result = await this.pool.query(query, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            return {
                id: row.id,
                name: row.name,
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                address: row.address,
                type: row.type,
                accessibility: row.accessibility,
                operatingHours: row.operating_hours,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
            };
        } catch (error) {
            console.error("화장실 조회 실패:", error);
            return null;
        }
    }

    async save(toilet: Toilet): Promise<Toilet> {
        const query = `
            INSERT INTO toilets (
                id, name, latitude, longitude, address, type,
                accessibility, operating_hours, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                address = EXCLUDED.address,
                type = EXCLUDED.type,
                accessibility = EXCLUDED.accessibility,
                operating_hours = EXCLUDED.operating_hours,
                updated_at = EXCLUDED.updated_at
            RETURNING *
        `;

        try {
            const result = await this.pool.query(query, [
                toilet.id,
                toilet.name,
                toilet.latitude,
                toilet.longitude,
                toilet.address,
                toilet.type,
                toilet.accessibility,
                toilet.operatingHours,
                toilet.createdAt,
                toilet.updatedAt,
            ]);

            const row = result.rows[0];
            return {
                id: row.id,
                name: row.name,
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                address: row.address,
                type: row.type,
                accessibility: row.accessibility,
                operatingHours: row.operating_hours,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
            };
        } catch (error) {
            console.error("화장실 저장 실패:", error);
            throw new Error("화장실 저장 중 오류가 발생했습니다.");
        }
    }

    async update(id: string, toilet: Partial<Toilet>): Promise<Toilet | null> {
        const fields = [];
        const values = [];
        let parameterIndex = 1;

        for (const [key, value] of Object.entries(toilet)) {
            if (value !== undefined) {
                const columnName =
                    key === "operatingHours"
                        ? "operating_hours"
                        : key === "createdAt"
                        ? "created_at"
                        : key === "updatedAt"
                        ? "updated_at"
                        : key;
                fields.push(`${columnName} = $${parameterIndex}`);
                values.push(value);
                parameterIndex++;
            }
        }

        if (fields.length === 0) {
            return await this.findById(id);
        }

        fields.push(`updated_at = $${parameterIndex}`);
        values.push(new Date());
        values.push(id);

        const query = `
            UPDATE toilets 
            SET ${fields.join(", ")} 
            WHERE id = $${parameterIndex + 1}
            RETURNING *
        `;

        try {
            const result = await this.pool.query(query, values);

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            return {
                id: row.id,
                name: row.name,
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                address: row.address,
                type: row.type,
                accessibility: row.accessibility,
                operatingHours: row.operating_hours,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
            };
        } catch (error) {
            console.error("화장실 업데이트 실패:", error);
            return null;
        }
    }

    async delete(id: string): Promise<boolean> {
        const query = "DELETE FROM toilets WHERE id = $1";

        try {
            const result = await this.pool.query(query, [id]);
            return (result.rowCount || 0) > 0;
        } catch (error) {
            console.error("화장실 삭제 실패:", error);
            return false;
        }
    }

    // 도쿄 API 데이터 대량 저장
    async saveTokyoToilets(toilets: Toilet[]): Promise<{
        saved: number;
        updated: number;
        failed: number;
    }> {
        console.log(
            `🗄️ 도쿄 화장실 ${toilets.length}개 데이터베이스 저장 시작`
        );

        let saved = 0;
        let updated = 0;
        let failed = 0;

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            for (const toilet of toilets) {
                try {
                    // 기존 데이터 확인
                    const existingQuery =
                        "SELECT id, updated_at FROM toilets WHERE id = $1";
                    const existingResult = await client.query(existingQuery, [
                        toilet.id,
                    ]);

                    if (existingResult.rows.length > 0) {
                        // 업데이트
                        const updateQuery = `
                            UPDATE toilets SET
                                name = $2,
                                latitude = $3,
                                longitude = $4,
                                address = $5,
                                type = $6,
                                accessibility = $7,
                                operating_hours = $8,
                                updated_at = $9
                            WHERE id = $1
                        `;

                        await client.query(updateQuery, [
                            toilet.id,
                            toilet.name,
                            toilet.latitude,
                            toilet.longitude,
                            toilet.address,
                            toilet.type,
                            toilet.accessibility,
                            toilet.operatingHours,
                            new Date(),
                        ]);
                        updated++;
                    } else {
                        // 새로 삽입
                        const insertQuery = `
                            INSERT INTO toilets (
                                id, name, latitude, longitude, address, type,
                                accessibility, operating_hours, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        `;

                        await client.query(insertQuery, [
                            toilet.id,
                            toilet.name,
                            toilet.latitude,
                            toilet.longitude,
                            toilet.address,
                            toilet.type,
                            toilet.accessibility,
                            toilet.operatingHours,
                            toilet.createdAt,
                            toilet.updatedAt,
                        ]);
                        saved++;
                    }
                } catch (error) {
                    console.warn(`⚠️ 화장실 ${toilet.id} 저장 실패:`, error);
                    failed++;
                }
            }

            await client.query("COMMIT");

            console.log(
                `✅ 도쿄 화장실 저장 완료: 신규 ${saved}개, 업데이트 ${updated}개, 실패 ${failed}개`
            );

            return { saved, updated, failed };
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("❌ 도쿄 화장실 대량 저장 실패:", error);
            throw error;
        } finally {
            client.release();
        }
    }

    // 저장된 도쿄 화장실 통계 조회
    async getTokyoToiletStats(): Promise<{
        total: number;
        byType: Record<string, number>;
        accessible: number;
        lastUpdated: Date | null;
    }> {
        try {
            const queries = [
                "SELECT COUNT(*) as total FROM toilets WHERE id LIKE 'tokyo_%'",
                "SELECT type, COUNT(*) as count FROM toilets WHERE id LIKE 'tokyo_%' GROUP BY type",
                "SELECT COUNT(*) as accessible FROM toilets WHERE id LIKE 'tokyo_%' AND accessibility = true",
                "SELECT MAX(updated_at) as last_updated FROM toilets WHERE id LIKE 'tokyo_%'",
            ];

            const [
                totalResult,
                typeResult,
                accessibleResult,
                lastUpdatedResult,
            ] = await Promise.all(
                queries.map((query) => this.pool.query(query))
            );

            const byType: Record<string, number> = {};
            typeResult.rows.forEach((row) => {
                byType[row.type] = parseInt(row.count);
            });

            return {
                total: parseInt(totalResult.rows[0].total),
                byType,
                accessible: parseInt(accessibleResult.rows[0].accessible),
                lastUpdated: lastUpdatedResult.rows[0].last_updated
                    ? new Date(lastUpdatedResult.rows[0].last_updated)
                    : null,
            };
        } catch (error) {
            console.error("도쿄 화장실 통계 조회 실패:", error);
            throw error;
        }
    }

    // 오래된 도쿄 데이터 정리
    async cleanupOldTokyoData(olderThanDays: number = 30): Promise<number> {
        const query = `
            DELETE FROM toilets 
            WHERE id LIKE 'tokyo_%' 
            AND updated_at < NOW() - INTERVAL '${olderThanDays} days'
        `;

        try {
            const result = await this.pool.query(query);
            const deletedCount = result.rowCount || 0;
            console.log(
                `🧹 ${deletedCount}개의 오래된 도쿄 화장실 데이터 정리됨`
            );
            return deletedCount;
        } catch (error) {
            console.error("도쿄 데이터 정리 실패:", error);
            throw error;
        }
    }
}
