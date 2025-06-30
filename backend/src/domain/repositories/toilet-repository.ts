import { Toilet, ToiletWithDistance, Location } from "@/domain/entities/toilet";

export interface ToiletRepository {
    findNearbyToilets(
        location: Location,
        radiusInMeters: number
    ): Promise<ToiletWithDistance[]>;
    findById(id: string): Promise<Toilet | null>;
    save(toilet: Toilet): Promise<Toilet>;
    update(id: string, toilet: Partial<Toilet>): Promise<Toilet | null>;
    delete(id: string): Promise<boolean>;
}
