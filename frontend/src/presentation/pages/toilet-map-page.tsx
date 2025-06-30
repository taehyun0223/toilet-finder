import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    GoogleMap,
    LoadScript,
    Marker,
    InfoWindow,
} from "@react-google-maps/api";
import { useToiletStore } from "@/application/stores/toilet-store";
import { findNearbyToiletsUseCase } from "@/config/dependency-injection";
import {
    Location,
    Toilet,
    ToiletType,
    ToiletWithDistance,
} from "@/domain/entities/toilet";
import SearchControls, {
    SearchMode,
} from "@/presentation/components/search-controls";
import ToiletCard from "@/presentation/components/toilet-card";

// 디버깅용 로그
console.log("🚽 ToiletMapPage: 컴포넌트 로딩 시작");

// Google Maps API 키 (환경변수에서 가져옴)
const GOOGLE_MAPS_API_KEY =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    "AIzaSyA-demo-key-replace-with-real-one";

// Google Maps 라이브러리 설정
const GOOGLE_MAPS_LIBRARIES: "places"[] = ["places"];

// 지도 스타일 설정
const MAP_CONTAINER_STYLE = {
    width: "100%",
    height: "60vh",
    borderRadius: "8px",
};

// 기본 지도 중심 (서울 시청)
const DEFAULT_CENTER = {
    lat: 37.5665,
    lng: 126.978,
};

// 지도 옵션
const MAP_OPTIONS = {
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: true,
    gestureHandling: "greedy" as const,
    mapTypeId: "roadmap" as const,
};

const ToiletMapPage: React.FC = () => {
    console.log("🚽 ToiletMapPage: 컴포넌트 렌더링 시작");

    // Store 상태 확인
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

    console.log("📊 Store 상태:", {
        toilets: toilets?.length || 0,
        currentLocation,
        isLoading,
        error,
    });

    const [searchMode, setSearchMode] = useState<SearchMode>("current");
    const [radius, setRadius] = useState(1000);
    const [mapCenter, setMapCenter] =
        useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);
    const [searchLocation, setSearchLocation] = useState<Location | null>(null);
    const [searchAddress, setSearchAddress] = useState<string>("");
    const [selectedToiletId, setSelectedToiletId] = useState<string | null>(
        null
    );
    const [debugStep, setDebugStep] = useState<string>("초기화");
    const mapRef = useRef<google.maps.Map | null>(null);
    const placesService = useRef<google.maps.places.PlacesService | null>(null);

    console.log("🔧 로컬 상태:", {
        searchMode,
        radius,
        mapCenter,
        searchLocation,
        debugStep,
    });

    useEffect(() => {
        console.log("🔄 useEffect 실행: searchMode 변경됨", searchMode);
        setDebugStep("위치 권한 요청");
        if (searchMode === "current") {
            getCurrentLocation();
        }
    }, [searchMode]);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        placesService.current = new google.maps.places.PlacesService(map);
        console.log("✅ Google Maps 로드 완료");
    }, []);

    const getCurrentLocation = () => {
        console.log("📍 getCurrentLocation 시작");
        setLoading(true);
        setError(null);
        setDebugStep("GPS 위치 가져오는 중");

        if (!navigator.geolocation) {
            const errorMsg = "이 브라우저에서는 위치 정보를 지원하지 않습니다.";
            console.error("❌ GPS 지원 안됨");
            setError(errorMsg);
            setLoading(false);
            setDebugStep("GPS 지원 안됨");
            return;
        }

        console.log("📍 GPS 위치 요청 중...");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log("✅ GPS 위치 획득 성공:", position.coords);
                const location: Location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                };
                setCurrentLocation(location);
                setSearchLocation(location);
                setMapCenter({
                    lat: location.latitude,
                    lng: location.longitude,
                });
                setDebugStep("화장실 검색 중");
                searchNearbyToilets(location, radius);
            },
            (error) => {
                console.error("❌ GPS 위치 획득 실패:", error);
                const errorMsg =
                    "위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.";
                setError(errorMsg);
                setLoading(false);
                setDebugStep("GPS 위치 획득 실패");
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    };

    const searchNearbyToilets = async (
        location: Location,
        searchRadius: number
    ) => {
        console.log("🔍 searchNearbyToilets 시작:", { location, searchRadius });
        setLoading(true);
        setError(null);
        setDebugStep("API 호출 중");

        try {
            console.log("📡 API 호출 시작...");
            const nearbyToilets = await findNearbyToiletsUseCase.execute(
                location,
                searchRadius
            );
            console.log("✅ API 호출 성공, 화장실 개수:", nearbyToilets.length);
            setToilets(nearbyToilets);
            setDebugStep(`검색 완료 (${nearbyToilets.length}개 찾음)`);
        } catch (error) {
            console.error("❌ API 호출 실패:", error);
            setError("주변 화장실을 찾을 수 없습니다.");
            setDebugStep("API 호출 실패");
        } finally {
            setLoading(false);
        }
    };

    const handleModeChange = (mode: SearchMode) => {
        setSearchMode(mode);
        setError(null);
        setToilets([]);
    };

    const handleRadiusChange = (newRadius: number) => {
        setRadius(newRadius);
        const targetLocation =
            searchMode === "current" ? currentLocation : searchLocation;
        if (targetLocation) {
            searchNearbyToilets(targetLocation, newRadius);
        }
    };

    const handleAddressSearch = (location: Location, address: string) => {
        setSearchLocation(location);
        setSearchAddress(address);
        setMapCenter({ lat: location.latitude, lng: location.longitude });
        searchNearbyToilets(location, radius);
    };

    const handleToiletCardClick = (toiletId: string) => {
        const toilet = toilets.find((t) => t.id === toiletId);
        if (toilet && mapRef.current) {
            setSelectedToiletId(toiletId);
            const newCenter = { lat: toilet.latitude, lng: toilet.longitude };
            setMapCenter(newCenter);
            mapRef.current.setCenter(newCenter);
            mapRef.current.setZoom(17);
        }
    };

    const getToiletTypeColor = (type: ToiletType) => {
        switch (type) {
            case ToiletType.PUBLIC:
                return "#1976D2"; // 진한 파란색 (공공시설)
            case ToiletType.PRIVATE:
                return "#FF9800"; // 주황색 (사설시설)
            case ToiletType.COMMERCIAL:
                return "#388E3C"; // 진한 초록색 (상업시설)
            default:
                return "#6C757D"; // 회색
        }
    };

    const getToiletIcon = (toilet: Toilet, isSelected: boolean = false) => {
        // Google Maps API가 로드되지 않았으면 undefined 반환 (기본 마커 사용)
        if (!window.google?.maps?.SymbolPath) {
            return undefined;
        }

        const color = isSelected ? "#E91E63" : getToiletTypeColor(toilet.type); // 핫핑크로 선택된 화장실 표시
        const scale = isSelected ? 1.8 : 1.4; // 크기 증가

        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 0.9, // 투명도 증가로 더 선명하게
            strokeColor: "#FFFFFF",
            strokeWeight: 3, // 테두리 두께 증가
            scale: scale * 8,
        };
    };

    const handleMarkerClick = (toilet: ToiletWithDistance) => {
        setSelectedToiletId(toilet.id === selectedToiletId ? null : toilet.id);
    };

    return (
        <div className="toilet-map-page">
            <div className="map-container">
                <div className="map-header">
                    <h1 className="map-title">🚽 주변 화장실 찾기</h1>
                    <div className="debug-info">
                        <span className="debug-step">
                            현재 상태: {debugStep}
                        </span>
                        {isLoading && (
                            <span className="loading-indicator">
                                🔄 로딩 중...
                            </span>
                        )}
                    </div>
                </div>

                <SearchControls
                    mode={searchMode}
                    onModeChange={handleModeChange}
                    radius={radius}
                    onRadiusChange={handleRadiusChange}
                    onAddressSearch={handleAddressSearch}
                    isLoading={isLoading}
                />

                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <div className="map-section">
                    <LoadScript
                        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                        libraries={GOOGLE_MAPS_LIBRARIES}
                        loadingElement={<div>🗺️ 지도 로딩 중...</div>}
                    >
                        <GoogleMap
                            mapContainerStyle={MAP_CONTAINER_STYLE}
                            center={mapCenter}
                            zoom={15}
                            options={MAP_OPTIONS}
                            onLoad={onMapLoad}
                        >
                            {/* 현재 위치 마커 */}
                            {currentLocation &&
                                searchMode === "current" &&
                                window.google?.maps?.SymbolPath && (
                                    <Marker
                                        position={{
                                            lat: currentLocation.latitude,
                                            lng: currentLocation.longitude,
                                        }}
                                        icon={{
                                            path: google.maps.SymbolPath.CIRCLE,
                                            fillColor: "#00BFFF", // 밝은 청록색 (현재 위치)
                                            fillOpacity: 1,
                                            strokeColor: "#FFFFFF",
                                            strokeWeight: 3,
                                            scale: 12, // 크기도 약간 키움
                                        }}
                                        title="현재 위치"
                                    />
                                )}

                            {/* 검색 위치 마커 */}
                            {searchLocation &&
                                searchMode === "address" &&
                                window.google?.maps?.SymbolPath && (
                                    <Marker
                                        position={{
                                            lat: searchLocation.latitude,
                                            lng: searchLocation.longitude,
                                        }}
                                        icon={{
                                            path: google.maps.SymbolPath
                                                .FORWARD_CLOSED_ARROW,
                                            fillColor: "#9C27B0", // 보라색 (검색 위치)
                                            fillOpacity: 1,
                                            strokeColor: "#FFFFFF",
                                            strokeWeight: 2,
                                            scale: 9, // 크기도 약간 키움
                                        }}
                                        title={`검색 위치: ${searchAddress}`}
                                    />
                                )}

                            {/* 화장실 마커들 */}
                            {toilets.map((toilet) => {
                                const customIcon = getToiletIcon(
                                    toilet,
                                    selectedToiletId === toilet.id
                                );
                                return (
                                    <Marker
                                        key={toilet.id}
                                        position={{
                                            lat: toilet.latitude,
                                            lng: toilet.longitude,
                                        }}
                                        icon={customIcon} // undefined면 기본 마커 사용
                                        title={toilet.name}
                                        onClick={() =>
                                            handleMarkerClick(toilet)
                                        }
                                    >
                                        {selectedToiletId === toilet.id && (
                                            <InfoWindow
                                                onCloseClick={() =>
                                                    setSelectedToiletId(null)
                                                }
                                            >
                                                <div className="toilet-info-window">
                                                    <h3>{toilet.name}</h3>
                                                    <p>
                                                        <strong>주소:</strong>{" "}
                                                        {toilet.address}
                                                    </p>
                                                    <p>
                                                        <strong>유형:</strong>{" "}
                                                        {toilet.type}
                                                    </p>
                                                    <p>
                                                        <strong>거리:</strong>{" "}
                                                        {Math.round(
                                                            toilet.distance || 0
                                                        )}
                                                        m
                                                    </p>
                                                    {toilet.operatingHours && (
                                                        <p>
                                                            <strong>
                                                                운영시간:
                                                            </strong>{" "}
                                                            {
                                                                toilet.operatingHours
                                                            }
                                                        </p>
                                                    )}
                                                    {toilet.nearbyPlaces &&
                                                        toilet.nearbyPlaces
                                                            .length > 0 && (
                                                            <div className="nearby-places-info">
                                                                <p>
                                                                    <strong>
                                                                        🏪 주변
                                                                        장소:
                                                                    </strong>
                                                                </p>
                                                                <ul className="nearby-places-list-info">
                                                                    {toilet.nearbyPlaces
                                                                        .slice(
                                                                            0,
                                                                            3
                                                                        )
                                                                        .map(
                                                                            (
                                                                                place,
                                                                                index
                                                                            ) => (
                                                                                <li
                                                                                    key={
                                                                                        index
                                                                                    }
                                                                                    className="nearby-place-info-item"
                                                                                >
                                                                                    <span className="place-name-info">
                                                                                        {
                                                                                            place.name
                                                                                        }
                                                                                    </span>
                                                                                    <span className="place-type-info">
                                                                                        (
                                                                                        {place.koreanType ||
                                                                                            "시설"}

                                                                                        )
                                                                                    </span>
                                                                                    {place.distance <
                                                                                        30 && (
                                                                                        <span className="place-distance-info">
                                                                                            -{" "}
                                                                                            {
                                                                                                place.distance
                                                                                            }

                                                                                            m
                                                                                        </span>
                                                                                    )}
                                                                                </li>
                                                                            )
                                                                        )}
                                                                </ul>
                                                            </div>
                                                        )}
                                                </div>
                                            </InfoWindow>
                                        )}
                                    </Marker>
                                );
                            })}
                        </GoogleMap>
                    </LoadScript>

                    {/* 지도 마커 범례 */}
                    <div className="map-legend">
                        <div className="legend-title">🗺️ 지도 범례</div>
                        <div className="legend-items">
                            <div className="legend-item">
                                <div className="legend-marker current-location"></div>
                                <span>현재 위치</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-marker search-location"></div>
                                <span>검색 위치</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-marker public-toilet"></div>
                                <span>공공 화장실</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-marker private-toilet"></div>
                                <span>사설 화장실</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-marker commercial-toilet"></div>
                                <span>상업 화장실</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="toilets-list">
                    <h2 className="list-title">
                        📋 검색 결과 ({toilets.length}개)
                    </h2>
                    {toilets.length > 0 ? (
                        <div className="toilet-cards">
                            {toilets.map((toilet) => (
                                <ToiletCard
                                    key={toilet.id}
                                    toilet={toilet}
                                    onLocationClick={() =>
                                        handleToiletCardClick(toilet.id)
                                    }
                                />
                            ))}
                        </div>
                    ) : (
                        !isLoading && (
                            <div className="no-results">
                                <span className="no-results-icon">🔍</span>
                                <p>검색 결과가 없습니다.</p>
                                <small>
                                    다른 위치나 더 넓은 반경으로 검색해보세요.
                                </small>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default ToiletMapPage;
