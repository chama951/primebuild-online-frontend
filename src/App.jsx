import "./App.css";
import ComponentManagement from "./components/features/ComponentManagement.jsx";
import ManufacturerManagement from "./components/features/ManufacturerManagement.jsx";
import ItemManagement from "./components/features/ItemManagement.jsx";
import BuildCart from "./components/features/BuildCart.jsx";
import Login from "./features/auth/Login.jsx";
import AdminDashboard from "./components/features/AdminDashboard.jsx";
import {Routes, Route} from "react-router-dom";

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login/>}/>
            <Route path="/item" element={<ItemManagement/>}/>
            <Route path="/manufacturer" element={<ManufacturerManagement/>}/>
            <Route path="/component" element={<ComponentManagement/>}/>
            <Route path="/build" element={<BuildCart/>}/>
        </Routes>
    );
}

export default App;
