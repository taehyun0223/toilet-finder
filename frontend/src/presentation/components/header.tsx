import React from "react";
import { Link, useLocation } from "react-router-dom";

const Header: React.FC = () => {
    const location = useLocation();

    return (
        <header>
            <nav>
                <Link to="/" className="logo">
                    🚽 Toilet Finder
                </Link>
                <ul className="nav-links">
                    <li>
                        <Link
                            to="/"
                            className={
                                location.pathname === "/" ? "active" : ""
                            }
                        >
                            홈
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/map"
                            className={
                                location.pathname === "/map" ? "active" : ""
                            }
                        >
                            🗺️ 지도 검색
                        </Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;
