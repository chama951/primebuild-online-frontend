import React from "react";

const Unauthorized = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md text-center">
                <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
                <p className="text-gray-700 mb-6">
                    You do not have permission to view this page.
                </p>
                <a
                    href="/login"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    Go to Login
                </a>
            </div>
        </div>
    );
};

export default Unauthorized;