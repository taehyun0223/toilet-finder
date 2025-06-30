import React from "react";
import { Link } from "react-router-dom";

const HomePage: React.FC = () => {
    const features = [
        {
            icon: "📍",
            title: "정확한 위치 기반 검색",
            description:
                "GPS를 활용한 현재 위치 또는 원하는 주소에서 가까운 화장실을 찾아보세요",
        },
        {
            icon: "🗺️",
            title: "직관적인 지도 인터페이스",
            description:
                "실시간 지도에서 화장실 위치를 한눈에 확인하고 경로를 계획하세요",
        },
        {
            icon: "🔍",
            title: "스마트 반경 검색",
            description:
                "500m부터 10km까지 원하는 범위에서 화장실을 검색할 수 있어요",
        },
        {
            icon: "♿",
            title: "접근성 정보 제공",
            description:
                "휠체어 접근 가능 여부와 운영시간 등 상세 정보를 확인하세요",
        },
        {
            icon: "🏷️",
            title: "화장실 타입 분류",
            description:
                "공공, 사설, 상업시설 화장실을 구분하여 필요에 맞게 선택하세요",
        },
        {
            icon: "📱",
            title: "모바일 친화적",
            description:
                "언제 어디서나 스마트폰으로 쉽고 빠르게 화장실을 찾을 수 있어요",
        },
    ];

    const stats = [
        { number: "실시간", label: "OpenStreetMap 데이터" },
        { number: "전국", label: "화장실 정보 제공" },
        { number: "무료", label: "서비스 이용" },
    ];

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-text">
                        <h1 className="hero-title">
                            🚽 화장실을 찾고 계신가요?
                        </h1>
                        <p className="hero-subtitle">
                            Toilet Finder로 가장 가까운 화장실을 빠르게
                            찾아보세요.
                            <br />
                            실시간 지도 기반으로 정확한 위치와 상세 정보를
                            제공합니다.
                        </p>
                        <div className="hero-actions">
                            <Link to="/map" className="cta-button primary">
                                🗺️ 지금 바로 찾기
                            </Link>
                            <button
                                className="cta-button secondary"
                                onClick={() => {
                                    document
                                        .getElementById("features")
                                        ?.scrollIntoView({
                                            behavior: "smooth",
                                        });
                                }}
                            >
                                기능 알아보기
                            </button>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="hero-card">
                            <div className="hero-card-header">
                                <span className="location-icon">📍</span>
                                <span>내 위치에서 1km 반경</span>
                            </div>
                            <div className="hero-card-content">
                                <div className="mock-toilet-item">
                                    <span>🏛️ 서울시청 공공화장실</span>
                                    <span className="distance">250m</span>
                                </div>
                                <div className="mock-toilet-item">
                                    <span>🛒 롯데백화점 화장실</span>
                                    <span className="distance">380m</span>
                                </div>
                                <div className="mock-toilet-item">
                                    <span>🏢 명동역 화장실</span>
                                    <span className="distance">450m</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="stats-container">
                    {stats.map((stat, index) => (
                        <div key={index} className="stat-item">
                            <div className="stat-number">{stat.number}</div>
                            <div className="stat-label">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="section-container">
                    <div className="section-header">
                        <h2 className="section-title">강력한 기능들</h2>
                        <p className="section-subtitle">
                            최신 기술과 사용자 중심 디자인으로 최고의 화장실
                            검색 경험을 제공합니다
                        </p>
                    </div>
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <div className="feature-icon">
                                    {feature.icon}
                                </div>
                                <h3 className="feature-title">
                                    {feature.title}
                                </h3>
                                <p className="feature-description">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-container">
                    <h2 className="cta-title">지금 바로 시작해보세요!</h2>
                    <p className="cta-subtitle">
                        무료로 이용할 수 있는 Toilet Finder로
                        <br />더 이상 화장실을 찾아 헤매지 마세요
                    </p>
                    <Link to="/map" className="cta-button primary large">
                        🚀 화장실 찾기 시작하기
                    </Link>
                    <div className="cta-note">
                        💡 위치 권한을 허용하면 더 정확한 검색이 가능합니다
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
