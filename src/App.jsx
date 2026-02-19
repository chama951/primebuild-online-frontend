import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/common/Navbar.jsx";

import ComponentManagement from "./components/features/ComponentManagement.jsx";
import ManufacturerManagement from "./components/features/ManufacturerManagement.jsx";
import ItemManagement from "./components/features/ItemManagement.jsx";
import BuildCart from "./components/features/BuildCart.jsx";
import AdminDashboard from "./components/features/Dashboard.jsx";
import RoleManagement from "./components/features/RoleManagement.jsx";
import UserManagement from "./components/features/UserManagement.jsx";

import Login from "./features/auth/Login.jsx";
import OAuth2Success from "./features/auth/OAuth2Success.jsx";
import ForgotPassword from "./features/auth/ForgotPassword.jsx";
import PrivateRoute from "./features/security/PrivateRoute.jsx";

const NotFound = () => (
    <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-gray-600 mb-4">Page not found</p>
        <a href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Go to Dashboard</a>
    </div>
);

const DashboardLayout = () => {
    return (
        <div>
            <Navbar />
            <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="item" element={<ItemManagement />} />
                <Route path="manufacturer" element={<ManufacturerManagement />} />
                <Route path="component" element={<ComponentManagement />} />
                <Route path="build" element={<BuildCart />} />
                <Route path="role" element={<RoleManagement />} />
                <Route path="user" element={<UserManagement />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </div>
    );
};

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/oauth2/redirect" element={<OAuth2Success />} />

            <Route
                path="/*"
                element={
                    <PrivateRoute>
                        <DashboardLayout />
                    </PrivateRoute>
                }
            />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default App;
