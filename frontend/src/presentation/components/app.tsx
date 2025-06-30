import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToiletProvider } from "@/application/stores/toilet-store";
import Header from "@/presentation/components/header";
import HomePage from "@/presentation/pages/home-page";
import ToiletMapPage from "@/presentation/pages/toilet-map-page";

// 에러 바운더리 컴포넌트
class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        console.error("🚨 React Error Boundary 캐치:", error);
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("🚨 컴포넌트 에러 상세:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        padding: "20px",
                        textAlign: "center",
                        backgroundColor: "#ffe6e6",
                        border: "1px solid #ff0000",
                        margin: "20px",
                    }}
                >
                    <h1>🚨 앱에서 오류가 발생했습니다</h1>
                    <p>브라우저 콘솔(F12)을 열어 자세한 오류를 확인해주세요.</p>
                    <details style={{ textAlign: "left", marginTop: "20px" }}>
                        <summary>오류 상세 정보</summary>
                        <pre
                            style={{
                                backgroundColor: "#f5f5f5",
                                padding: "10px",
                            }}
                        >
                            {this.state.error?.stack ||
                                this.state.error?.message}
                        </pre>
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: "20px", padding: "10px 20px" }}
                    >
                        페이지 새로고침
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

const App: React.FC = () => {
    console.log("🚀 App 컴포넌트 렌더링 시작");

    // React Router 상태 확인
    console.log("🌐 현재 URL:", window.location.href);
    console.log("🗺️ 현재 경로:", window.location.pathname);

    return (
        <ErrorBoundary>
            <ToiletProvider>
                <div className="app">
                    <Header />
                    <main>
                        <Routes>
                            <Route
                                path="/"
                                element={
                                    <div>
                                        {(() => {
                                            console.log(
                                                "🏠 HomePage 라우트 렌더링"
                                            );
                                            return null;
                                        })()}
                                        <HomePage />
                                    </div>
                                }
                            />
                            <Route
                                path="/map"
                                element={
                                    <div>
                                        {(() => {
                                            console.log(
                                                "🗺️ ToiletMapPage 라우트 렌더링"
                                            );
                                            return null;
                                        })()}
                                        <ToiletMapPage />
                                    </div>
                                }
                            />
                        </Routes>
                    </main>
                </div>
            </ToiletProvider>
        </ErrorBoundary>
    );
};

export default App;
