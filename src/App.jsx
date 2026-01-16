import "./App.css";
import ComponentManagement from "./components/features/ComponentsManagement.jsx";
import ManufacturerManagement from "./components/features/ManufacturerManagement.jsx";
import ItemManagement from "./components/features/ItemManagement.jsx";

function App() {
    return (
        <div>
            <ManufacturerManagement/>
            <ComponentManagement/>
            <ItemManagement/>
        </div>
    );
}

export default App;
