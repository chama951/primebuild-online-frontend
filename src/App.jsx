import "./App.css";
import ComponentManagement from "./components/features/ComponentManagement.jsx";
import ManufacturerManagement from "./components/features/ManufacturerManagement.jsx";
import ItemManagement from "./components/features/ItemManagement.jsx";
import BuildCart from "./components/features/BuildCart.jsx";

function App() {
    return (
        <div className="bg-gray-100">
            <ManufacturerManagement/>
            <ComponentManagement/>
            <ItemManagement/>
            <BuildCart />
        </div>
    );
}

export default App;
