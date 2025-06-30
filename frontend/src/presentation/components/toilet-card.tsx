import React from "react";
import { Toilet, ToiletType } from "@/domain/entities/toilet";

interface ToiletCardProps {
    toilet: Toilet;
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
