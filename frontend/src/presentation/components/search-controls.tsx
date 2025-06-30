import React, { useState, useRef, useEffect } from "react";
import { Location } from "@/domain/entities/toilet";

export type SearchMode = "current" | "address";

interface SearchControlsProps {
    mode: SearchMode;
    onModeChange: (mode: SearchMode) => void;
    radius: number;
    onRadiusChange: (radius: number) => void;
    onAddressSearch: (location: Location, address: string) => void;
    isLoading: boolean;
}

// Google Maps API 키
const GOOGLE_MAPS_API_KEY =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    "AIzaSyA-demo-key-replace-with-real-one";

const SearchControls: React.FC<SearchControlsProps> = ({
    mode,
    onModeChange,
    radius,
    onRadiusChange,
    onAddressSearch,
    isLoading,
}) => {
    const [address, setAddress] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [suggestions, setSuggestions] = useState<
        google.maps.places.AutocompletePrediction[]
    >([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const autocompleteService =
        useRef<google.maps.places.AutocompleteService | null>(null);
    const placesService = useRef<google.maps.places.PlacesService | null>(null);
    const geocoderService = useRef<google.maps.Geocoder | null>(null);

    // Google Maps API 로드 확인 및 서비스 초기화
    useEffect(() => {
        console.log("🔄 SearchControls useEffect 실행");
        console.log("🗺️ Google Maps API 상태 체크:", {
            google: !!window.google,
            maps: !!window.google?.maps,
            places: !!window.google?.maps?.places,
            Geocoder: !!window.google?.maps?.Geocoder,
        });

        // Geocoder는 기본 Maps API에 포함되어 있으므로 따로 초기화
        if (
            window.google &&
            window.google.maps &&
            window.google.maps.Geocoder
        ) {
            console.log("✅ Geocoder 초기화 중...");
            geocoderService.current = new google.maps.Geocoder();
            console.log(
                "✅ geocoderService 초기화 완료:",
                !!geocoderService.current
            );
        } else {
            console.error("❌ Geocoder 초기화 실패 - Maps API 미로드");
        }

        // Places API 관련 서비스는 places가 있을 때만 초기화
        if (window.google && window.google.maps && window.google.maps.places) {
            console.log("✅ Places API 서비스들 초기화 중...");
            autocompleteService.current =
                new google.maps.places.AutocompleteService();

            // PlacesService는 지도가 필요하므로 임시 div 생성
            const tempDiv = document.createElement("div");
            placesService.current = new google.maps.places.PlacesService(
                tempDiv
            );
            console.log("✅ Places API 서비스들 초기화 완료");
        } else {
            console.warn("⚠️ Places API 미로드 - 자동완성 기능 제한됨");
        }
    }, []);

    // 주소 입력 시 자동완성 검색
    const handleAddressInputChange = (value: string) => {
        setAddress(value);

        if (value.length > 2 && autocompleteService.current) {
            const request = {
                input: value,
                componentRestrictions: { country: ["jp", "kr"] }, // 일본과 한국 제한
                types: ["establishment", "geocode"], // 장소와 주소 모두 검색
            };

            autocompleteService.current.getPlacePredictions(
                request,
                (predictions, status) => {
                    if (
                        status === google.maps.places.PlacesServiceStatus.OK &&
                        predictions
                    ) {
                        setSuggestions(predictions.slice(0, 5)); // 최대 5개
                        setShowSuggestions(true);
                    } else {
                        setSuggestions([]);
                        setShowSuggestions(false);
                    }
                }
            );
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    // 자동완성 항목 선택
    const handleSuggestionSelect = (
        prediction: google.maps.places.AutocompletePrediction
    ) => {
        setAddress(prediction.description);
        setShowSuggestions(false);
        searchByPlaceId(prediction.place_id!);
    };

    // Place ID로 상세 정보 검색
    const searchByPlaceId = (placeId: string) => {
        if (!placesService.current) return;

        setIsSearching(true);

        const request = {
            placeId: placeId,
            fields: ["name", "geometry", "formatted_address"],
        };

        placesService.current.getDetails(request, (place, status) => {
            if (
                status === google.maps.places.PlacesServiceStatus.OK &&
                place?.geometry?.location
            ) {
                const location: Location = {
                    latitude: place.geometry.location.lat(),
                    longitude: place.geometry.location.lng(),
                };
                onAddressSearch(
                    location,
                    place.formatted_address || place.name || address
                );
            } else {
                alert("위치를 찾을 수 없습니다.");
            }
            setIsSearching(false);
        });
    };

    // 텍스트 주소로 검색 (Geocoding API 사용)
    const handleAddressSearch = async () => {
        console.log("🔍 검색 버튼 클릭됨!");
        console.log("📍 입력된 주소:", address);
        console.log(
            "🗺️ geocoderService 상태:",
            geocoderService.current ? "준비됨" : "없음"
        );
        console.log("🔑 API 키:", GOOGLE_MAPS_API_KEY.substring(0, 20) + "...");

        if (!address.trim()) {
            console.warn("⚠️ 주소가 입력되지 않음");
            alert("주소를 입력해주세요.");
            return;
        }

        // geocoderService가 없다면 지금 초기화 시도
        if (!geocoderService.current) {
            console.log("🔄 geocoderService 재초기화 시도...");
            console.log("💡 Google Maps API 로드 상태:", {
                google: !!window.google,
                maps: !!window.google?.maps,
                Geocoder: !!window.google?.maps?.Geocoder,
            });

            if (
                window.google &&
                window.google.maps &&
                window.google.maps.Geocoder
            ) {
                console.log("✅ 지금 Geocoder 초기화 중...");
                geocoderService.current = new google.maps.Geocoder();
                console.log(
                    "✅ geocoderService 재초기화 완료:",
                    !!geocoderService.current
                );
            } else {
                console.error("❌ Google Maps API가 여전히 로드되지 않음");
                alert(
                    "Google Maps API가 로드되지 않았습니다. 페이지를 새로고침 해보세요."
                );
                return;
            }
        }

        setIsSearching(true);
        console.log("🔍 검색 시작...");

        try {
            const request = {
                address: address,
                componentRestrictions: { country: "JP" }, // 주로 일본 검색
            };

            console.log("📡 Geocoding API 요청:", request);

            geocoderService.current.geocode(request, (results, status) => {
                console.log("📡 Geocoding API 응답 상태:", status);
                console.log("📡 Geocoding API 응답 결과:", results);

                if (
                    status === google.maps.GeocoderStatus.OK &&
                    results &&
                    results[0]
                ) {
                    console.log("✅ 주소 검색 성공!");
                    const location: Location = {
                        latitude: results[0].geometry.location.lat(),
                        longitude: results[0].geometry.location.lng(),
                    };
                    console.log("📍 찾은 위치:", location);
                    console.log(
                        "🏠 포맷된 주소:",
                        results[0].formatted_address
                    );

                    onAddressSearch(location, results[0].formatted_address);
                } else {
                    console.error("❌ 주소 검색 실패:", status);
                    alert(
                        "주소를 찾을 수 없습니다. 아래 빠른 검색 버튼을 이용해보세요."
                    );
                }
                setIsSearching(false);
            });
        } catch (error) {
            console.error("❌ 주소 검색 중 예외 발생:", error);
            alert("주소 검색 중 오류가 발생했습니다.");
            setIsSearching(false);
        }
    };

    const handleQuickSearch = (location: {
        lat: number;
        lng: number;
        name: string;
        address: string;
    }) => {
        console.log("⚡ 빠른 검색 버튼 클릭됨:", location);
        const searchLocation: Location = {
            latitude: location.lat,
            longitude: location.lng,
        };
        console.log("📍 검색 위치로 변환:", searchLocation);
        console.log("🔄 onAddressSearch 호출 중...");
        onAddressSearch(searchLocation, location.address);
    };

    // 도쿄 유명 장소 빠른 검색
    const tokyoQuickSearch = [
        {
            name: "🗼 도쿄타워",
            address: "東京都港区芝公園4-2-8",
            lat: 35.6586,
            lng: 139.7454,
        },
        {
            name: "🏯 도쿄역",
            address: "東京都千代田区丸の内1-9-1",
            lat: 35.6812,
            lng: 139.7671,
        },
        {
            name: "🌸 신주쿠",
            address: "東京都新宿区新宿3-38-1",
            lat: 35.6896,
            lng: 139.7006,
        },
        {
            name: "🛍️ 시부야",
            address: "東京都渋谷区道玄坂2-1",
            lat: 35.658,
            lng: 139.7016,
        },
        {
            name: "🏛️ 아사쿠사",
            address: "東京都台東区浅草2-3-1",
            lat: 35.7148,
            lng: 139.7967,
        },
        {
            name: "🎡 오다이바",
            address: "東京都港区台場1-4-1",
            lat: 35.6267,
            lng: 139.773,
        },
        {
            name: "🏢 긴자",
            address: "東京都中央区銀座4-6-16",
            lat: 35.6718,
            lng: 139.7668,
        },
        {
            name: "🌊 츠키지",
            address: "東京都中央区築地5-2-1",
            lat: 35.6654,
            lng: 139.7707,
        },
    ];

    const radiusOptions = [
        { value: 500, label: "500m" },
        { value: 1000, label: "1km" },
        { value: 2000, label: "2km" },
        { value: 5000, label: "5km" },
        { value: 10000, label: "10km" },
    ];

    return (
        <div className="search-controls">
            <div className="search-controls__header">
                <h2>🚽 화장실 검색</h2>
            </div>

            {/* 모드 전환 */}
            <div className="mode-toggle">
                <div className="mode-toggle__buttons">
                    <button
                        className={`mode-toggle__button ${
                            mode === "current" ? "active" : ""
                        }`}
                        onClick={() => onModeChange("current")}
                    >
                        📍 현재 위치
                    </button>
                    <button
                        className={`mode-toggle__button ${
                            mode === "address" ? "active" : ""
                        }`}
                        onClick={() => onModeChange("address")}
                    >
                        🔍 주소 검색
                    </button>
                </div>
            </div>

            {/* 주소 검색 입력 */}
            {mode === "address" && (
                <div className="address-search">
                    <div className="search-section">
                        <h3 className="search-section__title">
                            📍 Google 장소 검색
                        </h3>
                        <div className="input-group">
                            <div className="search-input-container">
                                <input
                                    type="text"
                                    placeholder="예: 도쿄타워, 신주쿠역, 서울역..."
                                    value={address}
                                    onChange={(e) =>
                                        handleAddressInputChange(e.target.value)
                                    }
                                    onKeyPress={(e) =>
                                        e.key === "Enter" &&
                                        handleAddressSearch()
                                    }
                                    onFocus={() =>
                                        setShowSuggestions(
                                            suggestions.length > 0
                                        )
                                    }
                                    className="address-search__input"
                                />
                                <button
                                    onClick={handleAddressSearch}
                                    disabled={isSearching || !address.trim()}
                                    className="address-search__button"
                                >
                                    {isSearching ? "🔍 검색 중..." : "🔍 검색"}
                                </button>
                            </div>

                            {/* 자동완성 제안 */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="suggestions-dropdown">
                                    {suggestions.map((suggestion, index) => (
                                        <div
                                            key={suggestion.place_id}
                                            className="suggestion-item"
                                            onClick={() =>
                                                handleSuggestionSelect(
                                                    suggestion
                                                )
                                            }
                                        >
                                            <span className="suggestion-icon">
                                                📍
                                            </span>
                                            <div className="suggestion-text">
                                                <div className="suggestion-main">
                                                    {
                                                        suggestion
                                                            .structured_formatting
                                                            .main_text
                                                    }
                                                </div>
                                                <div className="suggestion-secondary">
                                                    {
                                                        suggestion
                                                            .structured_formatting
                                                            .secondary_text
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="search-tips">
                            <small>
                                💡 구글맵스와 동일한 장소 검색을 지원합니다.
                                장소명이나 주소를 입력하세요.
                            </small>
                        </div>
                    </div>

                    {/* 도쿄 빠른 검색 */}
                    <div className="quick-search">
                        <h3 className="search-section__title">
                            ⚡ 도쿄 인기 장소
                        </h3>
                        <div className="quick-search__buttons">
                            {tokyoQuickSearch.map((location, index) => (
                                <button
                                    key={index}
                                    className="quick-search__button"
                                    onClick={() => handleQuickSearch(location)}
                                    disabled={isLoading}
                                >
                                    {location.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 반경 설정 */}
            <div className="radius-control">
                <h3 className="search-section__title">📏 검색 반경</h3>
                <div className="radius-buttons">
                    {radiusOptions.map((option) => (
                        <button
                            key={option.value}
                            className={`radius-button ${
                                radius === option.value ? "active" : ""
                            }`}
                            onClick={() => onRadiusChange(option.value)}
                            disabled={isLoading}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SearchControls;
