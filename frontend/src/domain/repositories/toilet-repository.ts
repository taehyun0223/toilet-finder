import { Toilet, Location } from "@/domain/entities/toilet";

export interface ToiletRepository {
    findNearbyToilets(location: Location, radius: number): Promise<Toilet[]>;
    getToiletById(id: string): Promise<Toilet | null>;
}
