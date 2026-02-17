import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Check if user is logged in
    const token = localStorage.getItem("jwtToken");
    const username = localStorage.getItem("username") || "";
    const roles = JSON.parse(localStorage.getItem("roles") || "[]");

    const handleLogout = () => {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("username");
        localStorage.removeItem("roles");
        navigate("/login");
    };

    // Simple link style highlight
    const linkClass = (path) =>
        `px-3 py-1 rounded hover:bg-gray-200 transition ${
            location.pathname === path ? "bg-gray-200 font-semibold" : ""
        }`;

    return (
        <nav className="bg-white shadow-md py-3 px-6 flex justify-between items-center">
            <div className="text-xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate("/")}>
                PrimeBuild
            </div>

            <div className="flex items-center space-x-4">
                <Link to="/" className={linkClass("/")}>
                    Home
                </Link>
                <Link to="/item" className={linkClass("/item")}>
                    Items
                </Link>
                <Link to="/dashboard" className={linkClass("/dashboard")}>
                    Dashboard
                </Link>

                {token ? (
                    <>
                        <div className="text-gray-700 text-right">
                            <p className="font-medium">{username}</p>
                            {roles.length > 0 && (
                                <p className="text-sm text-gray-500">{roles.join(", ")}</p>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <Link
                        to="/login"
                        className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition"
                    >
                        Login
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
