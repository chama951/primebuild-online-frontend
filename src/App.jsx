import "./App.css";
import {Routes, Route, Navigate} from "react-router-dom";
import Navbar from "./components/common/Navbar.jsx";

import ComponentManagement from "./components/features/ComponentManagement.jsx";
import ManufacturerManagement from "./components/features/ManufacturerManagement.jsx";
import ItemManagement from "./components/features/ItemManagement.jsx";
import BuildCart from "./components/features/BuildCart.jsx";
import Dashboard from "./components/features/Dashboard.jsx";
import RoleManagement from "./components/features/RoleManagement.jsx";
import UserManagement from "./components/features/UserManagement.jsx";
import Cart from "./components/features/Cart.jsx";

import Login from "./features/auth/Login.jsx";
import OAuth2Success from "./features/auth/OAuth2Success.jsx";
import ForgotPassword from "./features/auth/ForgotPassword.jsx";
import PrivateRoute from "./features/auth/PrivateRoute.jsx";

import Categories from "./components/features/Categories.jsx";
import Home from "./components/features/Home.jsx";
import TrendingProducts from "./components/features/TrendingProducts.jsx";
import Power from "./components/features/Power.jsx";
import Footer from "./components/features/Footer.jsx";

const NotFound = () => (
    <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-gray-600 mb-4">Page not found</p>
    </div>
);

const DashboardLayout = () => (
    <div>
        <Navbar/>
        <Routes>
            <Route index element={<Dashboard />} />

            <Route path="item" element={<ItemManagement />} />
            <Route path="manufacturer" element={<ManufacturerManagement />} />
            <Route path="component" element={<ComponentManagement />} />
            <Route path="build" element={<BuildCart />} />
            <Route path="role" element={<RoleManagement />} />
            <Route path="user" element={<UserManagement />} />

            <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
    </div>
);

const HomeLayout = () => (
    <div>
        <Navbar/>
        <Routes>
            <Route index element={<Home/>}/>
            <Route path="categories" element={<Categories/>}/>
            <Route path="power" element={<Power/>}/>
            <Route path="trending" element={<TrendingProducts/>}/>
            <Route path="/cart" element={<Cart />} />
        </Routes>
    </div>
);

function App() {
    return (
        <Routes>

            {/* Public */}
            <Route path="/home/*" element={<HomeLayout/>}/>
            <Route path="/" element={<Navigate to="/home" replace/>}/>

            <Route path="/login" element={<Login/>}/>
            <Route path="/forgot-password" element={<ForgotPassword/>}/>
            <Route path="/oauth2-success" element={<OAuth2Success/>}/>

            {/* Admin */}
            <Route
                path="/dashboard/*"
                element={
                    <PrivateRoute>
                        <DashboardLayout/>
                    </PrivateRoute>
                }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound/>}/>
        </Routes>
    );
}

export default App;