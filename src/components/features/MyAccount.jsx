import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    useGetCurrentUserQuery,
    useUpdateUserMutation
} from "../../services/userApi.js";
import NotificationDialogs from "../common/NotificationDialogs.jsx";

const MyAccount = () => {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
        action: null,
    });

    const token = localStorage.getItem("jwtToken");

    const { data: userData, isLoading, error } = useGetCurrentUserQuery(undefined, {
        skip: !token,
    });

    const [updateUser, { isLoading: isSubmitting }] = useUpdateUserMutation();

    useEffect(() => {
        if (userData) {
            setUsername(userData.username || "");
            setEmail(userData.email || "");
        }
    }, [userData]);

    useEffect(() => {
        if (!token) navigate("/login");
    }, [token, navigate]);

    const showNotification = (type, message, action = null) => {
        setNotification({ show: true, type, message, action });
    };

    const handleConfirmAction = async () => {
        if (notification.action) {
            const { callback } = notification.action;
            try {
                const result = await callback();
                const successMessage = result?.message || notification.action.successMessage || "Action completed!";
                showNotification("success", successMessage);
            } catch (error) {
                const errorMessage = error.message || notification.action.errorMessage || "Error performing action.";
                showNotification("error", errorMessage);
            } finally {
                setNotification(prev => ({ ...prev, action: null }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim() || !email.trim()) {
            showNotification("error", "Username and email cannot be empty");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification("error", "Enter a valid email address");
            return;
        }

        try {
            const response = await updateUser({
                id: userData.userId,
                username: username.trim(),
                email: email.trim(),
                signUpMethod: userData.signUpMethod || "DIRECT",
                roleId: userData.role?.id,
            }).unwrap();

            localStorage.setItem("username", username.trim());
            showNotification("success", response.message || "Account updated successfully!");
        } catch (error) {
            showNotification("error", error.data?.message || "Error updating account");
        }
    };

    const handleCancel = () => {
        if (userData) {
            setUsername(userData.username || "");
            setEmail(userData.email || "");
        }
    };

    if (!token) return null;

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading account details...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-red-600 font-medium">Failed to load account details</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6 border">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Summary</h2>
                    <ul className="space-y-3 text-sm text-gray-700">
                        <li className="flex justify-between">
                            <span className="font-medium">User ID:</span>
                            <span>#{userData?.userId}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="font-medium">Role:</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                {userData?.role?.roleName || "N/A"}
                            </span>
                        </li>
                        <li className="flex justify-between">
                            <span className="font-medium">Status:</span>
                            <span className={userData?.enabled ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                {userData?.enabled ? "Enabled" : "Disabled"}
                            </span>
                        </li>
                        <li className="flex justify-between">
                            <span className="font-medium">Member Since:</span>
                            <span>{userData?.createdDate || "N/A"}</span>
                        </li>
                        {userData?.updatedDate && (
                            <li className="flex justify-between">
                                <span className="font-medium">Last Updated:</span>
                                <span>{userData.updatedDate}</span>
                            </li>
                        )}
                    </ul>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Account</h2>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Username *</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={isSubmitting}
                                placeholder="Enter username"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Email Address *</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={isSubmitting}
                                placeholder="Enter email"
                                required
                            />
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                            <button
                                type="submit"
                                disabled={isSubmitting || !username.trim() || !email.trim()}
                                className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Updating...
                                    </span>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() => setNotification({ show: false, type: "", message: "", action: null })}
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() => setNotification({ show: false, type: "", message: "", action: null })}
                errorMessage={notification.message}
                errorAction={notification.action}
                onErrorAction={handleConfirmAction}
                isActionLoading={isSubmitting}
            />
        </div>
    );
};

export default MyAccount;
