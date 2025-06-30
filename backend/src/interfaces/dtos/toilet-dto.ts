export interface FindNearbyToiletsRequestDto {
    latitude: number;
    longitude: number;
    radius?: number;
    limit?: number;
}

export interface ToiletDto {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    type: string;
    accessibility: boolean;
    operatingHours?: string;
    distance?: number;
}

export interface FindNearbyToiletsResponseDto {
    success: boolean;
    data: {
        toilets: ToiletDto[];
        total: number;
    };
    message?: string;
}

export interface GetToiletByIdResponseDto {
    success: boolean;
    data: {
        toilet: ToiletDto | null;
    };
    message?: string;
}

export interface ErrorResponseDto {
    success: false;
    error: {
        code: string;
        message: string;
    };
}
