import "./App.css";
import ComponentManagement from "./components/features/ComponentManagement.jsx";
import ManufacturerManagement from "./components/features/ManufacturerManagement.jsx";
import ItemManagement from "./components/features/ItemManagement.jsx";

function App() {
    return (
        <div className="bg-gray-100">
            <ManufacturerManagement/>
            <ComponentManagement/>
            <ItemManagement/>
        </div>
    );
}

export default App;
