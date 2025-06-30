import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useToiletStore } from "@/application/stores/toilet-store";
import { findNearbyToiletsUseCase } from "@/config/dependency-injection";
import { Location } from "@/domain/entities/toilet";

// Leaflet 아이콘 설정
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const ToiletMapPage: React.FC = () => {
    const {
        toilets,
        currentLocation,
        isLoading,
        error,
        setToilets,
        setCurrentLocation,
        setLoading,
        setError,
    } = useToiletStore();

    const [mapCenter, setMapCenter] = useState<[number, number]>([
        37.5665, 126.978,
    ]); // 서울 시청

    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location: Location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                };
                setCurrentLocation(location);
                setMapCenter([location.latitude, location.longitude]);
                searchNearbyToilets(location);
            },
            (error) => {
                console.error("위치 정보 가져오기 실패:", error);
                setError(
                    "위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요."
                );
                setLoading(false);
            }
        );
    };

    const searchNearbyToilets = async (location: Location) => {
        try {
            const nearbyToilets = await findNearbyToiletsUseCase.execute(
                location,
                1000
            );
            setToilets(nearbyToilets);
        } catch (error) {
            setError("주변 화장실을 찾을 수 없습니다.");
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading">위치 정보를 가져오는 중...</div>
            </div>
        );
    }

    return (
        <div className="container">
            <h1>주변 화장실 지도</h1>

            {error && <div className="error">{error}</div>}

            <div className="map-container">
                <MapContainer
                    center={mapCenter}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {currentLocation && (
                        <Marker
                            position={[
                                currentLocation.latitude,
                                currentLocation.longitude,
                            ]}
                        >
                            <Popup>현재 위치</Popup>
                        </Marker>
                    )}

                    {toilets.map((toilet) => (
                        <Marker
                            key={toilet.id}
                            position={[toilet.latitude, toilet.longitude]}
                        >
                            <Popup>
                                <div>
                                    <h3>{toilet.name}</h3>
                                    <p>{toilet.address}</p>
                                    {toilet.distance && (
                                        <p>거리: {toilet.distance}m</p>
                                    )}
                                    <p>
                                        접근성:{" "}
                                        {toilet.accessibility
                                            ? "가능"
                                            : "불가능"}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            <div className="toilet-list">
                <h2>주변 화장실 목록 ({toilets.length}개)</h2>
                {toilets.map((toilet) => (
                    <div key={toilet.id} className="toilet-item">
                        <h3>{toilet.name}</h3>
                        <p>📍 {toilet.address}</p>
                        {toilet.distance && <p>📏 거리: {toilet.distance}m</p>}
                        <p>
                            ♿ 접근성:{" "}
                            {toilet.accessibility ? "가능" : "불가능"}
                        </p>
                        {toilet.operatingHours && (
                            <p>⏰ 운영시간: {toilet.operatingHours}</p>
                        )}
                    </div>
                ))}
            </div>

            <div style={{ margin: "2rem 0" }}>
                <button
                    className="button"
                    onClick={() =>
                        currentLocation && searchNearbyToilets(currentLocation)
                    }
                    disabled={isLoading || !currentLocation}
                >
                    다시 검색
                </button>
            </div>
        </div>
    );
};

export default ToiletMapPage;
