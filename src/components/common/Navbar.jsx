import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { useGetNotificationsQuery, useReadNotificationsMutation } from "../../features/components/notificationsApi.js";

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);
    const [open, setOpen] = useState(false);

    const token = localStorage.getItem("jwtToken");
    const username = localStorage.getItem("username") || "";
    const roles = JSON.parse(localStorage.getItem("roles") || "[]");
    const isOnlyCustomer = roles.length === 1 && roles.includes("CUSTOMER");

    const { data: notifications = [] } = useGetNotificationsQuery(undefined, {
        skip: !token,
        pollingInterval: 10000,
    });
    const [markAsRead] = useReadNotificationsMutation();
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleLogout = () => {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("username");
        localStorage.removeItem("roles");
        navigate("/login");
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length > 0) {
            markAsRead({
                notificationList: unreadIds.map(id => ({ id })),
            });
        }
    };

    const getDashboardButton = () => {
        if (!token || isOnlyCustomer) return null;

        if (location.pathname === "/home") {
            return (
                <button
                    onClick={() => navigate("/dashboard")}
                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition"
                >
                    Dashboard
                </button>
            );
        } else if (location.pathname === "/dashboard") {
            return (
                <button
                    onClick={() => navigate("/home")}
                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition"
                >
                    Home
                </button>
            );
        } else {
            return (
                <button
                    onClick={() => navigate("/dashboard")}
                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition"
                >
                    Dashboard
                </button>
            );
        }
    };

    return (
        <nav className="bg-white shadow-md border border-gray-300 rounded-lg py-3 px-6 flex justify-between items-center">
            <div
                className="text-xl font-bold text-blue-600 cursor-pointer"
                onClick={() => navigate("/home")}
            >
                PrimeBuild
            </div>

            <div className="flex items-center space-x-4">
                {token && (
                    <div className="relative" ref={dropdownRef}>
                        <div
                            className="cursor-pointer relative text-2xl text-gray-700 hover:text-blue-600 transition"
                            onClick={() => {
                                setOpen(!open);
                                if (!open) handleMarkAsRead();
                            }}
                        >
                            <FiBell />
                            {unreadCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </div>

                        {open && (
                            <div className="absolute right-0 mt-3 w-80 bg-white shadow-lg rounded-lg border z-50">
                                <div className="p-3 border-b font-semibold">Notifications</div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <p className="p-4 text-gray-500 text-sm">No notifications</p>
                                    ) : (
                                        [...notifications]
                                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                            .slice(0, 5)
                                            .map((n) => (
                                                <div
                                                    key={n.id}
                                                    className={`p-3 border-b text-sm hover:bg-gray-50 ${
                                                        !n.read ? "bg-blue-50 font-medium" : ""
                                                    }`}
                                                >
                                                    <p>{n.message}</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            ))
                                    )}
                                </div>
                                <div
                                    className="p-2 text-center text-blue-600 text-sm cursor-pointer hover:bg-gray-50"
                                    onClick={() => {
                                        setOpen(false);
                                        navigate("/notification");
                                    }}
                                >
                                    View All
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {token && (
                    <div className="text-gray-700 text-right">
                        <p className="font-medium">{username}</p>
                        {roles.length > 0 && <p className="text-sm text-gray-500">{roles.join(", ")}</p>}
                    </div>
                )}

                {getDashboardButton()}

                {token ? (
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition"
                    >
                        Logout
                    </button>
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