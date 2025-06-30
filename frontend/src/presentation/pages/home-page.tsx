import React from "react";
import { Link } from "react-router-dom";

const HomePage: React.FC = () => {
    return (
        <div className="container">
            <h1>🚽 Toilet Finder에 오신 것을 환영합니다!</h1>
            <p>주변의 화장실을 쉽고 빠르게 찾아보세요.</p>

            <div style={{ margin: "2rem 0" }}>
                <h2>주요 기능</h2>
                <ul
                    style={{
                        textAlign: "left",
                        maxWidth: "400px",
                        margin: "0 auto",
                    }}
                >
                    <li>현재 위치 기반 주변 화장실 검색</li>
                    <li>지도에서 화장실 위치 확인</li>
                    <li>거리별 정렬된 검색 결과</li>
                    <li>접근성 정보 제공</li>
                </ul>
            </div>

            <div style={{ margin: "2rem 0" }}>
                <Link to="/map">
                    <button
                        className="button"
                        style={{ fontSize: "1.2rem", padding: "1rem 2rem" }}
                    >
                        지도에서 화장실 찾기 🗺️
                    </button>
                </Link>
            </div>

            <div
                style={{ marginTop: "3rem", fontSize: "0.9rem", color: "#666" }}
            >
                <p>위치 정보 접근 권한이 필요합니다.</p>
                <p>더 정확한 검색을 위해 GPS를 활성화해주세요.</p>
            </div>
        </div>
    );
};

export default HomePage;
