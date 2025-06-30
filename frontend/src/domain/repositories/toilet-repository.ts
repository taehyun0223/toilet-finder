import { Toilet, Location, ToiletWithDistance } from "@/domain/entities/toilet";

export interface ToiletRepository {
    findNearbyToilets(
        location: Location,
        radius: number
    ): Promise<ToiletWithDistance[]>;
    getToiletById(id: string): Promise<Toilet | null>;
}
