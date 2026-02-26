import { useEffect, useState } from "react";
import DataTable from "../common/DataTable.jsx";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import ItemFeaturesSection from "./item/ItemFeaturesSection.jsx";
import {
    useGetItemsQuery,
    useCreateItemMutation,
    useUpdateItemMutation,
    useDeleteItemMutation,
} from "../../services/itemApi.js";
import { useGetComponentsQuery } from "../../services/componentApi.js";
import { useGetManufacturersQuery } from "../../services/manufacturerApi.js";
import Unauthorized from "../common/Unauthorized.jsx";

const ItemManagement = ({ refetchFlag, resetFlag }) => {
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({
        itemName: "",
        quantity: "",
        price: "",
        powerConsumption: "",
        discountPercentage: "",
        componentId: "",
        manufacturerId: "",
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [filterComponent, setFilterComponent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
        action: null,
    });
    const [refreshKey, setRefreshKey] = useState(0);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [createItem] = useCreateItemMutation();
    const [updateItem] = useUpdateItemMutation();
    const [deleteItem] = useDeleteItemMutation();

    const { data: items = [], error: itemsError, refetch: refetchItems } = useGetItemsQuery();
    const { data: components = [], error: componentsError } = useGetComponentsQuery();
    const { data: manufacturers = [], error: manufacturersError } = useGetManufacturersQuery();

    useEffect(() => {
        if (refetchFlag) {
            refetchItems();
            resetFlag();
        }
    }, [refetchFlag, resetFlag, refetchItems]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterComponent]);

    useEffect(() => {
        if (selectedItem && items.length > 0) {
            const updatedItem = items.find(item => item.id === selectedItem.id);
            if (updatedItem) {
                setSelectedItem(updatedItem);
                setFormData({
                    itemName: updatedItem.itemName || "",
                    quantity: updatedItem.quantity?.toString() || "",
                    price: updatedItem.price?.toString() || "",
                    powerConsumption: updatedItem.powerConsumption?.toString() || "",
                    discountPercentage: updatedItem.discountPercentage?.toString() || "",
                    componentId: updatedItem.component?.id?.toString() || "",
                    manufacturerId: updatedItem.manufacturer?.id?.toString() || "",
                });
            }
        }
    }, [items]);

    const isUnauthorized = () =>
        [itemsError, componentsError, manufacturersError].some(
            error => error?.status === 401 || error?.status === 403
        );

    if (isUnauthorized()) return <Unauthorized />;

    const filteredItems = items.filter(item =>
        (item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.manufacturer?.manufacturerName?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!filterComponent || item.component?.id === parseInt(filterComponent))
    );

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

    const selectedComponent = components.find(c => c.id === parseInt(formData.componentId));

    const showNotification = (type, message, action = null) =>
        setNotification({ show: true, type, message, action });

    const handleConfirmAction = async () => {
        if (!notification.action) return;
        const { callback } = notification.action;
        setIsSubmitting(true);
        try {
            const result = await callback();
            showNotification("success", result?.data?.message || "Action completed!");
            await refetchItems();
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            showNotification("error", error.data?.message || "Error performing action.");
        } finally {
            setIsSubmitting(false);
            setNotification(prev => ({ ...prev, action: null }));
        }
    };

    const handleInputChange = (e) =>
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSelectItem = (item) => {
        setSelectedItem(item);
        setFormData({
            itemName: item.itemName || "",
            quantity: item.quantity?.toString() || "",
            price: item.price?.toString() || "",
            powerConsumption: item.powerConsumption?.toString() || "",
            discountPercentage: item.discountPercentage?.toString() || "",
            componentId: item.component?.id?.toString() || "",
            manufacturerId: item.manufacturer?.id?.toString() || "",
        });
        setRefreshKey(prev => prev + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!formData.itemName.trim() || !formData.componentId || !formData.manufacturerId) {
            showNotification("error", "Please fill in all required fields");
            setIsSubmitting(false);
            return;
        }

        const itemData = {
            itemName: formData.itemName.trim(),
            quantity: parseInt(formData.quantity) || 0,
            price: parseFloat(formData.price) || 0,
            powerConsumption: parseFloat(formData.powerConsumption) || 0,
            discountPercentage: parseFloat(formData.discountPercentage) || 0,
            componentId: parseInt(formData.componentId),
            manufacturerId: parseInt(formData.manufacturerId),
            featureList: selectedItem?.featureList || [],
        };

        try {
            const response = selectedItem
                ? await updateItem({ id: selectedItem.id, ...itemData }).unwrap()
                : await createItem(itemData).unwrap();

            showNotification("success", response.message || "Operation completed successfully!");
            await refetchItems();
            handleResetForm();
        } catch (error) {
            showNotification("error", error.data?.message || "An error occurred while saving.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteItem = (item) => {
        showNotification("error", `Are you sure you want to delete "${item.itemName}"?`, {
            callback: async () => {
                const response = await deleteItem(item.id).unwrap();
                await refetchItems();
                if (selectedItem?.id === item.id) handleResetForm();
                return response;
            },
        });
    };

    const handleResetForm = () => {
        setSelectedItem(null);
        setFormData({
            itemName: "",
            quantity: "",
            price: "",
            powerConsumption: "",
            discountPercentage: "",
            componentId: "",
            manufacturerId: ""
        });
        setRefreshKey(prev => prev + 1);
    };

    const formatCurrency = (price) => {
        return new Intl.NumberFormat("en-LK", {
            minimumFractionDigits: 2
        }).format(price);
    };

    const handleItemUpdated = async () => {
        await refetchItems();
        setRefreshKey(prev => prev + 1);
    };

    const columns = [
        {
            key: "id",
            header: "ID",
            render: (item) => (
                <div className="text-sm text-gray-500">#{item.id}</div>
            )
        },
        {
            key: "itemName",
            header: "Item Name",
            render: (item) => (
                <div className="text-sm font-medium">
                    {item.itemName}
                </div>
            )
        },
        {
            key: "component",
            header: "Component",
            render: (item) => (
                <div className="text-sm">
                    {item.component?.componentName || "N/A"}
                </div>
            )
        },
        {
            key: "price",
            header: "Price",
            render: (item) => (
                <div className="text-sm">
                    Rs {formatCurrency(item.price || 0)}
                </div>
            )
        },
    ];

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Search items..."
                                className="w-full p-2 border rounded"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <select
                                className="h-10 w-48 p-2 border rounded"
                                value={filterComponent}
                                onChange={(e) => setFilterComponent(e.target.value)}
                            >
                                <option value="">All Components</option>
                                {components.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.componentName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <DataTable
                        items={paginatedItems}
                        selectedItem={selectedItem}
                        onSelectItem={handleSelectItem}
                        onDeleteItemClick={handleDeleteItem}
                        isLoading={false}
                        columns={columns}
                        emptyMessage="No items found"
                    />

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-4">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Prev
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 border rounded ${currentPage === page ? "bg-blue-600 text-white" : ""}`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
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
                                {components.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.componentName}
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
                                {manufacturers.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.manufacturerName}
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
                                />
                                <input
                                    type="number"
                                    name="price"
                                    placeholder="Price (Rs)"
                                    className="p-2 border rounded"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="number"
                                    name="powerConsumption"
                                    placeholder="Power(W)"
                                    className="p-2 border rounded"
                                    value={formData.powerConsumption}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="number"
                                    name="discountPercentage"
                                    placeholder="Discount %"
                                    className="p-2 border rounded"
                                    value={formData.discountPercentage}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    {selectedItem ? "Update" : "Create"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetForm}
                                    className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    Clear
                                </button>
                            </div>
                        </form>
                    </div>

                    {formData.componentId && selectedItem && (
                        <ItemFeaturesSection
                            key={`features-${selectedItem.id}-${refreshKey}`}
                            selectedComponent={selectedComponent}
                            selectedItem={selectedItem}
                            showNotification={showNotification}
                            isSubmitting={isSubmitting}
                            setIsSubmitting={setIsSubmitting}
                            onItemUpdated={handleItemUpdated}
                        />
                    )}
                </div>
            </div>

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