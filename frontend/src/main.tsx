import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/presentation/components/app";
import "@/presentation/styles/index.css";

console.log("🚀 애플리케이션 시작");
console.log("🌐 브라우저 정보:", navigator.userAgent);
console.log("📍 Geolocation 지원:", !!navigator.geolocation);

// CSS 파일 로드 확인
console.log("🎨 CSS 로딩 시작");

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
