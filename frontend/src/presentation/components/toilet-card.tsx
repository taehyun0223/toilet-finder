import React from "react";
import { Toilet, ToiletType, NearbyPlace } from "@/domain/entities/toilet";

interface ToiletCardProps {
    toilet: Toilet & { distance?: number; nearbyPlaces?: NearbyPlace[] };
    onLocationClick: () => void;
}

const ToiletCard: React.FC<ToiletCardProps> = ({ toilet, onLocationClick }) => {
    const getToiletTypeIcon = (type: ToiletType) => {
        switch (type) {
            case ToiletType.PUBLIC:
                return "🏛️";
            case ToiletType.PRIVATE:
                return "🏢";
            case ToiletType.COMMERCIAL:
                return "🛒";
            default:
                return "🚽";
        }
    };

    const getToiletTypeName = (type: ToiletType) => {
        switch (type) {
            case ToiletType.PUBLIC:
                return "공공";
            case ToiletType.PRIVATE:
                return "사설";
            case ToiletType.COMMERCIAL:
                return "상업";
            default:
                return "일반";
        }
    };

    const formatDistance = (distance?: number) => {
        if (!distance) return "";
        if (distance >= 1000) {
            return `${(distance / 1000).toFixed(1)}km`;
        }
        return `${distance}m`;
    };

    const getPlaceTypeInKorean = (types: string[]): string => {
        const typeMap: { [key: string]: string } = {
            convenience_store: "편의점",
            gas_station: "주유소",
            restaurant: "음식점",
            cafe: "카페",
            bank: "은행",
            atm: "ATM",
            pharmacy: "약국",
            hospital: "병원",
            subway_station: "지하철역",
            bus_station: "버스정류장",
            school: "학교",
            university: "대학교",
            shopping_mall: "쇼핑몰",
            supermarket: "마트",
            department_store: "백화점",
            hotel: "호텔",
            tourist_attraction: "관광지",
            park: "공원",
            gym: "헬스장",
            beauty_salon: "미용실",
            laundry: "세탁소",
            store: "상점",
            establishment: "시설",
        };

        for (const type of types) {
            if (typeMap[type]) {
                return typeMap[type];
            }
        }

        return "시설";
    };

    return (
        <div className="toilet-card">
            <div className="toilet-card__header">
                <div className="toilet-card__title">
                    <span className="toilet-card__icon">
                        {getToiletTypeIcon(toilet.type)}
                    </span>
                    <h3 className="toilet-card__name">{toilet.name}</h3>
                </div>
                {toilet.distance && (
                    <div className="toilet-card__distance">
                        <span className="distance-badge">
                            {formatDistance(toilet.distance)}
                        </span>
                    </div>
                )}
            </div>

            <div className="toilet-card__content">
                <div className="toilet-card__info">
                    <div className="info-item">
                        <span className="info-icon">📍</span>
                        <span className="info-text">{toilet.address}</span>
                    </div>

                    <div className="info-item">
                        <span className="info-icon">🏷️</span>
                        <span className="info-text">
                            {getToiletTypeName(toilet.type)}
                        </span>
                    </div>

                    <div className="info-item">
                        <span className="info-icon">♿</span>
                        <span
                            className={`accessibility-badge ${
                                toilet.accessibility
                                    ? "accessible"
                                    : "not-accessible"
                            }`}
                        >
                            {toilet.accessibility ? "접근 가능" : "접근 불가"}
                        </span>
                    </div>

                    {toilet.operatingHours && (
                        <div className="info-item">
                            <span className="info-icon">⏰</span>
                            <span className="info-text">
                                {toilet.operatingHours}
                            </span>
                        </div>
                    )}

                    {/* 주변 장소 정보 표시 */}
                    {toilet.nearbyPlaces && toilet.nearbyPlaces.length > 0 && (
                        <div className="info-item nearby-places">
                            <span className="info-icon">🏪</span>
                            <div className="nearby-places-content">
                                <span className="nearby-places-title">
                                    주변 장소:
                                </span>
                                <div className="nearby-places-list">
                                    {toilet.nearbyPlaces
                                        .slice(0, 2)
                                        .map((place, index) => (
                                            <span
                                                key={index}
                                                className="nearby-place-item"
                                            >
                                                <span className="place-name">
                                                    {place.name}
                                                </span>
                                                <span className="place-type">
                                                    (
                                                    {getPlaceTypeInKorean(
                                                        place.types
                                                    )}
                                                    )
                                                </span>
                                                {place.distance < 20 && (
                                                    <span className="place-distance">
                                                        - {place.distance}m
                                                    </span>
                                                )}
                                            </span>
                                        ))}
                                    {toilet.nearbyPlaces.length > 2 && (
                                        <span className="more-places">
                                            외 {toilet.nearbyPlaces.length - 2}
                                            곳
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="toilet-card__actions">
                <button
                    className="action-button primary"
                    onClick={onLocationClick}
                >
                    🗺️ 지도에서 보기
                </button>
            </div>
        </div>
    );
};

export default ToiletCard;
