import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToiletProvider } from "@/application/stores/toilet-store";
import Header from "@/presentation/components/header";
import HomePage from "@/presentation/pages/home-page";
import ToiletMapPage from "@/presentation/pages/toilet-map-page";

const App: React.FC = () => {
    return (
        <ToiletProvider>
            <div className="app">
                <Header />
                <main>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/map" element={<ToiletMapPage />} />
                    </Routes>
                </main>
            </div>
        </ToiletProvider>
    );
};

export default App;
