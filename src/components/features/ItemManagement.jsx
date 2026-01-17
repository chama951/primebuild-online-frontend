import { useState } from "react";
import ItemListTable from "../common/ItemListTable.jsx";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import ItemFeaturesSection from "./item/ItemFeaturesSection.jsx";
import {
    useGetItemsQuery,
    useCreateItemMutation,
    useUpdateItemMutation,
    useDeleteItemMutation,
} from "../../features/components/itemApi.js";
import { useGetComponentsQuery } from "../../features/components/componentApi.js";
import { useGetManufacturersQuery } from "../../features/components/manufacturerApi.js";

const ItemManagement = () => {
    // State
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({
        itemName: "",
        quantity: "",
        price: "",
        componentId: "",
        manufacturerId: "",
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [filterComponent, setFilterComponent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState({
        show: false,
        type: "", // "success" or "error"
        message: "",
        action: null,
    });

    // API hooks
    const { data: items = [], refetch: refetchItems } = useGetItemsQuery();
    const { data: components = [] } = useGetComponentsQuery();
    const { data: manufacturers = [] } = useGetManufacturersQuery();

    // Mutations
    const [createItem] = useCreateItemMutation();
    const [updateItem] = useUpdateItemMutation();
    const [deleteItem] = useDeleteItemMutation();

    // item
    const filteredItems = items.filter(
        (item) =>
            item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (!filterComponent || item.component?.id === parseInt(filterComponent))
    );

    const selectedComponent = components.find((c) => c.id === parseInt(formData.componentId));

    // Notification handler
    const showNotification = (type, message, action = null) => {
        setNotification({ show: true, type, message, action });
    };

    const handleConfirmAction = async () => {
        if (notification.action) {
            const { callback } = notification.action;
            setIsSubmitting(true);
            try {
                await callback();
                showNotification("success", notification.action.successMessage || "Action completed!");
            } catch (error) {
                console.error("Error:", error);
                showNotification("error", notification.action.errorMessage || "Error performing action.");
            } finally {
                setIsSubmitting(false);
                setNotification((prev) => ({ ...prev, action: null }));
            }
        }
    };

    // Form handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectItem = (item) => {
        setSelectedItem(item);
        setFormData({
            itemName: item.itemName,
            quantity: item.quantity.toString(),
            price: item.price.toString(),
            componentId: item.component?.id || "",
            manufacturerId: item.manufacturer?.id || "",
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Basic validation
        if (!formData.itemName.trim() || !formData.componentId || !formData.manufacturerId) {
            showNotification("error", "Please fill in all required fields");
            setIsSubmitting(false);
            return;
        }

        const itemData = {
            ...formData,
            quantity: formData.quantity || "0",
            price: formData.price || "0.00",
        };

        try {
            if (selectedItem) {
                await updateItem({ id: selectedItem.id, ...itemData }).unwrap();
                showNotification("success", "Item updated successfully!");
            } else {
                await createItem(itemData).unwrap();
                showNotification("success", "Item created successfully!");
            }

            handleResetForm();
            refetchItems();
        } catch (error) {
            console.error("Error saving item:", error);
            showNotification("error", "Error saving item. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteItem = (item) => {
        showNotification("error", `Are you sure you want to delete "${item.itemName}"?`, {
            callback: async () => {
                await deleteItem(item.id).unwrap();
                refetchItems();
                if (selectedItem?.id === item.id) {
                    handleResetForm();
                }
            },
            successMessage: "Item deleted successfully!",
            errorMessage: "Error deleting item.",
        });
    };

    const handleResetForm = () => {
        setSelectedItem(null);
        setFormData({
            itemName: "",
            quantity: "",
            price: "",
            componentId: "",
            manufacturerId: "",
        });
    };

    // Table columns
    const columns = [
        {
            key: "itemName",
            header: "Item Name",
            render: (item) => <div className="text-sm font-medium">{item.itemName}</div>,
        },
        {
            key: "component",
            header: "Component",
            render: (item) => <div className="text-sm">{item.component?.componentName || "N/A"}</div>,
        },
        {
            key: "price",
            header: "Price",
            render: (item) => <div className="text-sm">Rs {parseFloat(item.price || 0).toFixed(2)}</div>,
        },
    ];

    return (
        <div className="container mx-auto p-4 space-y-6">
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
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="absolute right-3 top-2.5 text-gray-400"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <select
                                className="w-48 p-2.5 border rounded"
                                value={filterComponent}
                                onChange={(e) => setFilterComponent(e.target.value)}
                            >
                                <option value="">All Components</option>
                                {components.map((component) => (
                                    <option key={component.id} value={component.id}>
                                        {component.componentName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Items Table */}
                    <ItemListTable
                        items={filteredItems}
                        selectedItem={selectedItem}
                        onSelectItem={handleSelectItem}
                        onDeleteItemClick={handleDeleteItem}
                        isLoading={false}
                        columns={columns}
                        emptyMessage="No items found"
                    />
                </div>

                {/* Right Column: Item Form and Features */}
                <div className="space-y-4">
                    {/* Item Form */}
                    <div className="bg-white rounded-lg border p-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text"
                                name="itemName"
                                placeholder="Item Name *"
                                className="w-full p-2 border rounded"
                                value={formData.itemName}
                                onChange={handleInputChange}
                                required
                            />

                            <select
                                name="componentId"
                                className="w-full p-2 border rounded"
                                value={formData.componentId}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select Component *</option>
                                {components.map((component) => (
                                    <option key={component.id} value={component.id}>
                                        {component.componentName}
                                    </option>
                                ))}
                            </select>

                            <select
                                name="manufacturerId"
                                className="w-full p-2 border rounded"
                                value={formData.manufacturerId}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select Manufacturer *</option>
                                {manufacturers.map((manufacturer) => (
                                    <option key={manufacturer.id} value={manufacturer.id}>
                                        {manufacturer.manufacturerName}
                                    </option>
                                ))}
                            </select>

                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="number"
                                    name="quantity"
                                    placeholder="Quantity"
                                    className="p-2 border rounded"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    min="0"
                                />
                                <input
                                    type="number"
                                    name="price"
                                    placeholder="Price (Rs)"
                                    className="p-2 border rounded"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    min="0"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={
                                        isSubmitting ||
                                        !formData.itemName.trim() ||
                                        !formData.componentId ||
                                        !formData.manufacturerId
                                    }
                                    className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? "..." : selectedItem ? "Update" : "Create"}
                                </button>
                                {(selectedItem || formData.itemName.trim() || formData.componentId || formData.manufacturerId) && (
                                    <button
                                        type="button"
                                        onClick={handleResetForm}
                                        className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Features Section component */}
                    {formData.componentId && (
                        <ItemFeaturesSection
                            selectedComponent={selectedComponent}
                            selectedItem={selectedItem}
                            showNotification={showNotification}
                            isSubmitting={isSubmitting}
                            setIsSubmitting={setIsSubmitting}
                        />
                    )}
                </div>
            </div>

            {/* Global Notification Dialog */}
            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() =>
                    setNotification({ show: false, type: "", message: "", action: null })
                }
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() =>
                    setNotification({ show: false, type: "", message: "", action: null })
                }
                errorMessage={notification.message}
                errorAction={notification.action}
                onErrorAction={handleConfirmAction}
                isActionLoading={isSubmitting}
            />
        </div>
    );
};

export default ItemManagement;