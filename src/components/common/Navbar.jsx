import React, {useState, useRef, useEffect} from "react";
import PrimeBuildBanner from "../../assets/primebuild_banner-cropped.svg";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {FiBell, FiUser} from "react-icons/fi";
import {formatDistanceToNow} from "date-fns";

import {
    useGetNotificationsQuery,
    useReadNotificationsMutation,
    useDeleteAllNotificationsMutation
} from "../../services/notificationsApi.js";

import {useIsCustomerLoggedInQuery} from "../../services/authApi.js";

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const notificationRef = useRef(null);
    const userRef = useRef(null);

    const [notificationOpen, setNotificationOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);

    const token = localStorage.getItem("jwtToken");
    const username = localStorage.getItem("username") || "";
    const roles = JSON.parse(localStorage.getItem("roles") || "[]");

    const {data: isCustomerLoggedIn = false} =
        useIsCustomerLoggedInQuery(undefined, {skip: !token});

    const {data: notifications = []} =
        useGetNotificationsQuery(undefined, {
            skip: !token,
            pollingInterval: 10000,
        });

    const [markAsRead] = useReadNotificationsMutation();
    const [deleteAllNotifications, {isLoading: deleting}] =
        useDeleteAllNotificationsMutation();

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleLogout = () => {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("username");
        localStorage.removeItem("roles");
        navigate("/login");
    };

    const handleMarkAsRead = () => {
        const unreadIds = notifications
            .filter(n => !n.read)
            .map(n => n.id);

        if (unreadIds.length > 0) {
            markAsRead({
                notificationList: unreadIds.map(id => ({id})),
            });
        }
    };

    const handleDeleteAll = async () => {
        try {
            await deleteAllNotifications().unwrap();
            setNotificationOpen(false);
        } catch (err) {
            console.error("Failed to delete notifications:", err);
        }
    };

    const getDashboardButton = () => {
        if (!token || isCustomerLoggedIn) return null;

        if (location.pathname === "/home") {
            return (
                <button
                    onClick={() => navigate("/dashboard")}
                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition"
                >
                    Dashboard
                </button>
            );
        }

        if (location.pathname === "/dashboard") {
            return (
                <button
                    onClick={() => navigate("/home")}
                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition"
                >
                    Home
                </button>
            );
        }

        return (
            <button
                onClick={() => navigate("/dashboard")}
                className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition"
            >
                Dashboard
            </button>
        );
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target)
            ) {
                setNotificationOpen(false);
            }

            if (
                userRef.current &&
                !userRef.current.contains(event.target)
            ) {
                setUserOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <nav
            className="bg-white shadow-md border border-gray-300 rounded-lg py-3 px-6 flex justify-between items-center">
            {/* Logo */}
            <div
                className="cursor-pointer"
                onClick={() => navigate("/home")}
            >
                <img
                    src={PrimeBuildBanner}
                    alt="PrimeBuild"
                    className="h-10"
                />
            </div>

            <div className="flex items-center space-x-6">
                {getDashboardButton()}
                {token && (
                    <div className="relative" ref={notificationRef}>
                        <div
                            className="cursor-pointer relative text-2xl text-gray-700 hover:text-blue-600 transition"
                            onClick={() => {
                                setNotificationOpen(!notificationOpen);
                                if (!notificationOpen) handleMarkAsRead();
                            }}
                        >
                            <FiBell/>
                            {unreadCount > 0 && (
                                <span
                                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </div>

                        {notificationOpen && (
                            <div className="absolute right-0 mt-3 w-80 bg-white shadow-lg rounded-lg border z-50">
                                <div className="p-3 border-b font-semibold flex justify-between items-center">
                                    <span>Notifications</span>
                                    <button
                                        onClick={handleDeleteAll}
                                        disabled={deleting}
                                        className="text-red-500 text-sm hover:text-red-700"
                                    >
                                        {deleting ? "Deleting..." : "Clear All"}
                                    </button>
                                </div>

                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <p className="p-4 text-gray-500 text-sm">
                                            No notifications
                                        </p>
                                    ) : (
                                        [...notifications]
                                            .sort(
                                                (a, b) =>
                                                    new Date(b.createdAt) -
                                                    new Date(a.createdAt)
                                            )
                                            .slice(0, 5)
                                            .map((n) => (
                                                <div
                                                    key={n.id}
                                                    className={`p-3 border-b text-sm hover:bg-gray-50 ${
                                                        !n.read
                                                            ? "bg-blue-50 font-medium"
                                                            : ""
                                                    }`}
                                                >
                                                    <p className="font-bold text-gray-800">
                                                        {n.title}
                                                    </p>
                                                    <p>{n.message}</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {formatDistanceToNow(
                                                            new Date(n.createdAt),
                                                            {addSuffix: true}
                                                        )}
                                                    </p>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {token && (
                    <div className="relative" ref={userRef}>
                        <div
                            className="cursor-pointer text-2xl text-gray-700 hover:text-blue-600 transition"
                            onClick={() => setUserOpen(!userOpen)}
                        >
                            <FiUser/>
                        </div>

                        {userOpen && (
                            <div className="absolute right-0 mt-3 w-64 bg-white shadow-lg rounded-lg border z-50">
                                <div className="p-3 border-b font-semibold">
                                    Account
                                </div>

                                <div className="p-3 text-sm space-y-3">
                                    <div>
                                        <span className="text-xs text-gray-500">
                                            Username
                                        </span>
                                        <p className="font-medium text-gray-800">
                                            {username}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="text-xs text-gray-500">
                                            Roles
                                        </span>
                                        <ul className="list-disc list-inside text-gray-800 mt-1">
                                            {roles.length > 0 ? (
                                                roles.map((role, index) => (
                                                    <li key={index}>{role}</li>
                                                ))
                                            ) : (
                                                <li>No roles assigned</li>
                                            )}
                                        </ul>
                                    </div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition mt-2"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}


                {!token && (
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