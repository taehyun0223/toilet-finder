import axios from "axios";
import { Location, Toilet, ToiletType } from "@/domain/entities/toilet";
import { DistanceCalculator } from "@/domain/services/distance-calculator";

interface OverpassElement {
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    tags?: Record<string, string>;
}

interface OverpassResponse {
    elements: OverpassElement[];
}

export class OverpassApiClient {
    private readonly baseUrl = "https://overpass-api.de/api/interpreter";
    private readonly timeout = 30000;

    async findToiletsNearLocation(
        location: Location,
        radiusInMeters: number
    ): Promise<Toilet[]> {
        const query = this.buildOverpassQuery(location, radiusInMeters);

        try {
            const response = await axios.post<OverpassResponse>(
                this.baseUrl,
                query,
                {
                    timeout: this.timeout,
                    headers: {
                        "Content-Type": "text/plain; charset=utf-8",
                        "User-Agent":
                            "ToiletFinder/1.0 (https://toilet-finder.com)",
                    },
                }
            );

            return this.parseOverpassResponse(response.data, location);
        } catch (error) {
            throw new Error(`Overpass API 호출 실패: ${error}`);
        }
    }

    private buildOverpassQuery(
        location: Location,
        radiusInMeters: number
    ): string {
        return `
      [out:json][timeout:25];
      (
        node["amenity"="toilets"](around:${radiusInMeters},${location.latitude},${location.longitude});
        way["amenity"="toilets"](around:${radiusInMeters},${location.latitude},${location.longitude});
        relation["amenity"="toilets"](around:${radiusInMeters},${location.latitude},${location.longitude});
      );
      out center meta;
    `;
    }

    private parseOverpassResponse(
        response: OverpassResponse,
        userLocation: Location
    ): Toilet[] {
        const toilets: Toilet[] = [];

        for (const element of response.elements) {
            if (!element.lat || !element.lon || !element.tags) {
                continue;
            }

            const toilet: Toilet = {
                id: `overpass_${element.id}`,
                name:
                    element.tags.name || element.tags.operator || "공공 화장실",
                latitude: element.lat,
                longitude: element.lon,
                address: this.buildAddress(element.tags),
                type: this.determineToiletType(element.tags),
                accessibility: this.determineAccessibility(element.tags),
                operatingHours: element.tags.opening_hours,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            toilets.push(toilet);
        }

        return toilets;
    }

    private buildAddress(tags: Record<string, string>): string {
        const addressParts: string[] = [];

        if (tags["addr:city"]) addressParts.push(tags["addr:city"]);
        if (tags["addr:district"]) addressParts.push(tags["addr:district"]);
        if (tags["addr:street"]) addressParts.push(tags["addr:street"]);
        if (tags["addr:housenumber"])
            addressParts.push(tags["addr:housenumber"]);

        return addressParts.length > 0
            ? addressParts.join(" ")
            : "주소 정보 없음";
    }

    private determineToiletType(tags: Record<string, string>): ToiletType {
        if (
            tags.fee === "yes" ||
            tags.operator?.includes("상점") ||
            tags.operator?.includes("마트")
        ) {
            return ToiletType.COMMERCIAL;
        }

        if (tags.access === "private" || tags.access === "customers") {
            return ToiletType.PRIVATE;
        }

        return ToiletType.PUBLIC;
    }

    private determineAccessibility(tags: Record<string, string>): boolean {
        return (
            tags.wheelchair === "yes" ||
            tags["wheelchair:access"] === "yes" ||
            tags.disabled === "yes"
        );
    }
}
