import {
    useGetItemsByComponentIdQuery
} from "../../features/components/itemApi.js";

import {useGetComponentsQuery} from "../../features/components/componentApi.js";
import Table from "./table.jsx";
import {useState} from "react";
// import {useGetManufacturersQuery} from "../../features/components/manufacturerApi.js";

const ComponentItemsTable = ({component}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterComponent, setFilterComponent] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);


    const {data: items = [], refetch: refetchItems} = useGetItemsByComponentIdQuery(component.id);
    const {data: components = []} = useGetComponentsQuery();

    const filteredItems = items.filter((item) =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.manufacturer.manufacturerName.toLowerCase().includes(searchTerm.toLowerCase())
        && (!filterComponent || item.component?.id === parseInt(filterComponent)));

    const handleSelectItem = (item) => {
        setSelectedItem(item);
        // setFormData({
        //     itemName: item.itemName,
        //     quantity: item.quantity.toString(),
        //     price: item.price.toString(),
        //     componentId: item.component?.id || "",
        //     manufacturerId: item.manufacturer?.id || "",
        // });
    };

    const columns = [
        {
            key: "id",
            header: "ID",
            render: (item) => <div className="text-sm text-gray-500">#{item.id}</div>,
        },
        {
            key: "itemName", header: "Item Name", render: (item) =>
                <div className="space-y-1">

                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800'">
            <span className="text-xs font-medium text-gray-600">
                {item.manufacturer.manufacturerName}
             </span>
                    </div>

                    <div className="text-sm font-medium">{item.itemName}</div>
                </div>,
        }, {
            key: "component",
            header: "Component",
            render: (item) => <div className="text-sm">{item.component?.componentName || "N/A"}</div>,
        }, {
            key: "price",
            header: "Price",
            render: (item) => <div className="text-sm">Rs {parseFloat(item.price || 0).toFixed(2)}</div>,
        },];

    return (<div className="container mx-auto p-4 space-y-6">
        <h1 className="text-2xl font-bold">Item Management</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Item List */}
            <div className="lg:col-span-2 space-y-4">
                {/* Search and Filter */}
                <div className="bg-white rounded-lg border p-4">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search items..."
                                className="w-full pl-4 pr-10 py-2 border rounded"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (<button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-2.5 text-gray-400"
                            >
                                ✕
                            </button>)}
                        </div>
                        <select
                            className="w-48 p-2.5 border rounded"
                            value={filterComponent}
                            onChange={(e) => setFilterComponent(e.target.value)}
                        >
                            <option value="">All Components</option>
                            {components.map((component) => (<option key={component.id} value={component.id}>
                                {component.componentName}
                            </option>))}
                        </select>
                    </div>
                </div>

                {/* Items Table */}
                <Table
                    items={filteredItems}
                    selectedItem={selectedItem}
                    onSelectItem={handleSelectItem}
                    // onDeleteItemClick={handleDeleteItem}
                    isLoading={false}
                    columns={columns}
                    emptyMessage="No items found"
                />
            </div>
        </div>
    </div>);
};

export default ComponentItemsTable;