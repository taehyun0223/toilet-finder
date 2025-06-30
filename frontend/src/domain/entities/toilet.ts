export interface Toilet {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    type: ToiletType;
    accessibility: boolean;
    operatingHours?: string;
    createdAt: Date;
    updatedAt: Date;
}

// 주변 장소 정보 인터페이스 추가
export interface NearbyPlace {
    name: string;
    types: string[];
    distance: number; // 미터 단위
    placeId?: string;
    rating?: number;
    vicinity?: string;
    koreanType?: string; // 한국어 장소 타입
}

// 화장실에 주변 장소 정보 추가
export interface ToiletWithNearbyPlaces extends Toilet {
    nearbyPlaces?: NearbyPlace[];
}

export interface ToiletWithDistance extends Toilet {
    distance: number;
    nearbyPlaces?: NearbyPlace[];
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
