import { Request, Response } from "express";
import { FindNearestToilets } from "@/application/use-cases/find-nearest-toilets";
import { ToiletRepository } from "@/domain/repositories/toilet-repository";
import {
    FindNearbyToiletsRequestDto,
    FindNearbyToiletsResponseDto,
    GetToiletByIdResponseDto,
    ToiletDto,
    ErrorResponseDto,
} from "@/interfaces/dtos/toilet-dto";
import { ToiletWithDistance, Toilet } from "@/domain/entities/toilet";

export class ToiletController {
    constructor(
        private findNearestToilets: FindNearestToilets,
        private toiletRepository: ToiletRepository
    ) {}

    async getNearbyToilets(req: Request, res: Response): Promise<void> {
        try {
            const {
                latitude,
                longitude,
                radius = 1000,
                limit = 50,
            } = req.query;

            // 입력 값 검증
            if (!latitude || !longitude) {
                const errorResponse: ErrorResponseDto = {
                    success: false,
                    error: {
                        code: "INVALID_PARAMETERS",
                        message: "위도와 경도는 필수 파라미터입니다.",
                    },
                };
                res.status(400).json(errorResponse);
                return;
            }

            const lat = parseFloat(latitude as string);
            const lng = parseFloat(longitude as string);
            const rad = parseInt(radius as string);
            const lim = parseInt(limit as string);

            if (
                isNaN(lat) ||
                isNaN(lng) ||
                lat < -90 ||
                lat > 90 ||
                lng < -180 ||
                lng > 180
            ) {
                const errorResponse: ErrorResponseDto = {
                    success: false,
                    error: {
                        code: "INVALID_COORDINATES",
                        message: "올바르지 않은 좌표값입니다.",
                    },
                };
                res.status(400).json(errorResponse);
                return;
            }

            // Use case 실행
            const result = await this.findNearestToilets.execute({
                location: { latitude: lat, longitude: lng },
                radiusInMeters: rad,
                limit: lim,
            });

            // DTO 변환
            const toiletDtos: ToiletDto[] = result.toilets.map(
                this.toToiletDto
            );

            const response: FindNearbyToiletsResponseDto = {
                success: true,
                data: {
                    toilets: toiletDtos,
                    total: result.total,
                },
            };

            res.json(response);
        } catch (error) {
            const errorResponse: ErrorResponseDto = {
                success: false,
                error: {
                    code: "INTERNAL_ERROR",
                    message: "주변 화장실 검색 중 오류가 발생했습니다.",
                },
            };
            res.status(500).json(errorResponse);
        }
    }

    async getToiletById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                const errorResponse: ErrorResponseDto = {
                    success: false,
                    error: {
                        code: "MISSING_ID",
                        message: "화장실 ID가 필요합니다.",
                    },
                };
                res.status(400).json(errorResponse);
                return;
            }

            const toilet = await this.toiletRepository.findById(id);

            const response: GetToiletByIdResponseDto = {
                success: true,
                data: {
                    toilet: toilet ? this.toToiletDto(toilet) : null,
                },
            };

            res.json(response);
        } catch (error) {
            const errorResponse: ErrorResponseDto = {
                success: false,
                error: {
                    code: "INTERNAL_ERROR",
                    message: "화장실 정보 조회 중 오류가 발생했습니다.",
                },
            };
            res.status(500).json(errorResponse);
        }
    }

    private toToiletDto(toilet: Toilet | ToiletWithDistance): ToiletDto {
        return {
            id: toilet.id,
            name: toilet.name,
            latitude: toilet.latitude,
            longitude: toilet.longitude,
            address: toilet.address,
            type: toilet.type,
            accessibility: toilet.accessibility,
            operatingHours: toilet.operatingHours,
            distance: "distance" in toilet ? toilet.distance : undefined,
        };
    }
}
