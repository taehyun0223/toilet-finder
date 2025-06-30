import React from "react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
    return (
        <header
            style={{
                padding: "1rem",
                backgroundColor: "#646cff",
                color: "white",
            }}
        >
            <nav
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <h1 style={{ margin: 0 }}>
                    <Link
                        to="/"
                        style={{ color: "white", textDecoration: "none" }}
                    >
                        🚽 Toilet Finder
                    </Link>
                </h1>
                <div style={{ display: "flex", gap: "1rem" }}>
                    <Link
                        to="/"
                        style={{ color: "white", textDecoration: "none" }}
                    >
                        홈
                    </Link>
                    <Link
                        to="/map"
                        style={{ color: "white", textDecoration: "none" }}
                    >
                        지도
                    </Link>
                </div>
            </nav>
        </header>
    );
};

export default Header;
