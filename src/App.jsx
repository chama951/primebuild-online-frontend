import "./App.css";
import ComponentManagement from "./components/features/ComponentManagement.jsx";
import ManufacturerManagement from "./components/features/ManufacturerManagement.jsx";
import ItemManagement from "./components/features/ItemManagement.jsx";
import BuildCart from "./components/features/BuildCart.jsx";
import Login from "./features/auth/Login.jsx";
import AdminDashboard from "./components/features/Dashboard.jsx";
import {Routes, Route} from "react-router-dom";
import OAuth2Success from "./features/auth/OAuth2Success.jsx";
import Navbar from "./components/common/Navbar.jsx";
import PrivateRoute from "./features/security/PrivateRoute.jsx";

function App() {
    return (
        <div>
            <Navbar/>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/oauth2/redirect" element={<OAuth2Success />} />
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <AdminDashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/item"
                    element={
                        <PrivateRoute>
                            <ItemManagement />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/manufacturer"
                    element={
                        <PrivateRoute>
                            <ManufacturerManagement />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/component"
                    element={
                        <PrivateRoute>
                            <ComponentManagement />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/build"
                    element={
                        <PrivateRoute>
                            <BuildCart />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </div>

    );
}

export default App;
