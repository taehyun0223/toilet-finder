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
      SELECT 
        id, name, latitude, longitude, address, type, accessibility, operating_hours,
        created_at, updated_at,
        (
          6371000 * acos(
            cos(radians($1)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(latitude))
          )
        ) as distance
      FROM toilets
      WHERE (
        6371000 * acos(
          cos(radians($1)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(latitude))
        )
      ) <= $3
      ORDER BY distance
    `;

        try {
            const result = await this.pool.query(query, [
                location.latitude,
                location.longitude,
                radiusInMeters,
            ]);

            return result.rows.map((row) => ({
                id: row.id,
                name: row.name,
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                address: row.address,
                type: row.type as ToiletType,
                accessibility: row.accessibility,
                operatingHours: row.operating_hours,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                distance: Math.round(parseFloat(row.distance)),
            }));
        } catch (error) {
            throw new Error(`주변 화장실 검색 실패: ${error}`);
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
                type: row.type as ToiletType,
                accessibility: row.accessibility,
                operatingHours: row.operating_hours,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            };
        } catch (error) {
            throw new Error(`화장실 조회 실패: ${error}`);
        }
    }

    async save(toilet: Toilet): Promise<Toilet> {
        const query = `
      INSERT INTO toilets (id, name, latitude, longitude, address, type, accessibility, operating_hours)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
            ]);

            const row = result.rows[0];
            return {
                id: row.id,
                name: row.name,
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                address: row.address,
                type: row.type as ToiletType,
                accessibility: row.accessibility,
                operatingHours: row.operating_hours,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            };
        } catch (error) {
            throw new Error(`화장실 저장 실패: ${error}`);
        }
    }

    async update(id: string, toilet: Partial<Toilet>): Promise<Toilet | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (toilet.name !== undefined) {
            fields.push(`name = $${paramCount++}`);
            values.push(toilet.name);
        }
        if (toilet.latitude !== undefined) {
            fields.push(`latitude = $${paramCount++}`);
            values.push(toilet.latitude);
        }
        if (toilet.longitude !== undefined) {
            fields.push(`longitude = $${paramCount++}`);
            values.push(toilet.longitude);
        }
        if (toilet.address !== undefined) {
            fields.push(`address = $${paramCount++}`);
            values.push(toilet.address);
        }
        if (toilet.type !== undefined) {
            fields.push(`type = $${paramCount++}`);
            values.push(toilet.type);
        }
        if (toilet.accessibility !== undefined) {
            fields.push(`accessibility = $${paramCount++}`);
            values.push(toilet.accessibility);
        }
        if (toilet.operatingHours !== undefined) {
            fields.push(`operating_hours = $${paramCount++}`);
            values.push(toilet.operatingHours);
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        fields.push(`updated_at = $${paramCount++}`);
        values.push(new Date());
        values.push(id);

        const query = `
      UPDATE toilets 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
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
                type: row.type as ToiletType,
                accessibility: row.accessibility,
                operatingHours: row.operating_hours,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            };
        } catch (error) {
            throw new Error(`화장실 업데이트 실패: ${error}`);
        }
    }

    async delete(id: string): Promise<boolean> {
        const query = "DELETE FROM toilets WHERE id = $1";

        try {
            const result = await this.pool.query(query, [id]);
            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            throw new Error(`화장실 삭제 실패: ${error}`);
        }
    }
}
