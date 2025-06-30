export interface Toilet {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    type: ToiletType;
    accessibility: boolean;
    operatingHours?: string;
    distance?: number; // 사용자 위치로부터의 거리 (미터)
}

export enum ToiletType {
    PUBLIC = "PUBLIC",
    PRIVATE = "PRIVATE",
    COMMERCIAL = "COMMERCIAL",
}

export interface Location {
    latitude: number;
    longitude: number;
}
