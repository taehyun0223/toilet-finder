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

export enum ToiletType {
    PUBLIC = "PUBLIC",
    PRIVATE = "PRIVATE",
    COMMERCIAL = "COMMERCIAL",
}

export interface Location {
    latitude: number;
    longitude: number;
}

export interface ToiletWithDistance extends Toilet {
    distance: number;
}
