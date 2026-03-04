import { useEffect, useState } from "react";
import DataTable from "../common/DataTable.jsx";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import ItemFeaturesSection from "./item/ItemFeaturesSection.jsx";
import {
    useGetPaginatedItemsQuery,
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
    const [filterComponent, setFilterComponent] = useState(""); // component filter
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState({ show: false, type: "", message: "", action: null });
    const [refreshKey, setRefreshKey] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [createItem] = useCreateItemMutation();
    const [updateItem] = useUpdateItemMutation();
    const [deleteItem] = useDeleteItemMutation();

    const { data: components = [], error: componentsError } = useGetComponentsQuery();
    const { data: manufacturers = [], error: manufacturersError } = useGetManufacturersQuery();

    // --- Items query: all items on load, filter/search dynamically ---
    const {
        data: itemsData,
        error: itemsError,
        refetch: refetchItems,
        isFetching: isLoadingItems
    } = useGetPaginatedItemsQuery(
        {
            componentId: filterComponent || "", // empty = all items
            page: currentPage - 1,
            size: itemsPerPage,
            search: searchTerm.trim() || "",
        },
        { refetchOnMountOrArgChange: true }
    );

    const totalPages = itemsData?.totalPages || 1;
    const paginatedItems = itemsData?.content || [];

    // --- Reset page on search/filter change ---
    useEffect(() => setCurrentPage(1), [searchTerm, filterComponent]);

    // --- Refetch on external flag ---
    useEffect(() => {
        if (refetchFlag) {
            refetchItems();
            resetFlag();
        }
    }, [refetchFlag, resetFlag, refetchItems]);

    // --- Update selected item if it exists in the current page ---
    useEffect(() => {
        if (selectedItem) {
            const updated = paginatedItems.find(item => item.id === selectedItem.id);
            if (updated) {
                setSelectedItem(updated);
                setFormData({
                    itemName: updated.itemName || "",
                    quantity: updated.quantity?.toString() || "",
                    price: updated.price?.toString() || "",
                    powerConsumption: updated.powerConsumption?.toString() || "",
                    discountPercentage: updated.discountPercentage?.toString() || "",
                    componentId: updated.component?.id?.toString() || "",
                    manufacturerId: updated.manufacturer?.id?.toString() || "",
                });
            }
        }
    }, [paginatedItems, selectedItem]);

    const isUnauthorized = () =>
        [itemsError, componentsError, manufacturersError].some(err => err?.status === 401 || err?.status === 403);
    if (isUnauthorized()) return <Unauthorized />;

    const selectedComponent = components.find(c => c.id === parseInt(formData.componentId));

    const showNotification = (type, message, action = null) =>
        setNotification({ show: true, type, message, action });

    const handleInputChange = e =>
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSelectItem = item => {
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

    const handleResetForm = () => {
        setSelectedItem(null);
        setFormData({
            itemName: "",
            quantity: "",
            price: "",
            powerConsumption: "",
            discountPercentage: "",
            componentId: "",
            manufacturerId: "",
        });
        setRefreshKey(prev => prev + 1);
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!formData.itemName || !formData.componentId || !formData.manufacturerId) {
            showNotification("error", "Please fill all required fields");
            setIsSubmitting(false);
            return;
        }
        const itemData = {
            itemName: formData.itemName,
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
            showNotification("success", response.message || "Operation successful!");
            await refetchItems();
            handleResetForm();
        } catch (error) {
            showNotification("error", error.data?.message || "Error saving item");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteItem = item => {
        showNotification("error", `Delete "${item.itemName}"?`, {
            callback: async () => {
                const res = await deleteItem(item.id).unwrap();
                await refetchItems();
                if (selectedItem?.id === item.id) handleResetForm();
                return res;
            },
        });
    };

    const formatCurrency = price =>
        new Intl.NumberFormat("en-LK", { minimumFractionDigits: 2 }).format(price);

    const columns = [
        {
            key: "id",
            header: "ID",
            render: item => (
                <div className="text-sm text-gray-500">
                    #{item.id}
                </div>
            )
        },
        {
            key: "itemName",
            header: "Item Name",
            render: item => (
                <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-gray-800">
                    {item.itemName}
                </span>
                    <span className="text-xs text-gray-500">
                    {item.manufacturer?.manufacturerName || "N/A"}
                </span>
                </div>
            )
        },
        {
            key: "component",
            header: "Component",
            render: item => (
                <div className="text-sm">
                    {item.component?.componentName || "N/A"}
                </div>
            )
        },
        {
            key: "price",
            header: "Price",
            render: item => (
                <div className="text-sm">
                    Rs {formatCurrency(item.price || 0)}
                </div>
            )
        }
    ];

    const getPageNumbers = (current, total, maxPages = 5) => {
        let start = Math.max(1, current - Math.floor(maxPages / 2));
        let end = start + maxPages - 1;
        if (end > total) { end = total; start = Math.max(1, end - maxPages + 1); }
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {/* Filters */}
                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Search items..."
                                className="w-full p-2 border rounded"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <select
                                className="h-10 w-48 p-2 border rounded"
                                value={filterComponent}
                                onChange={e => setFilterComponent(e.target.value)}
                            >
                                <option value="">All Components</option>
                                {components.map(c => (
                                    <option key={c.id} value={c.id}>{c.componentName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Data Table */}
                    <DataTable
                        items={paginatedItems}
                        selectedItem={selectedItem}
                        onSelectItem={handleSelectItem}
                        onDeleteItemClick={handleDeleteItem}
                        isLoading={isLoadingItems}
                        columns={columns}
                        emptyMessage="No items found"
                    />

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-4">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >Prev</button>

                            {getPageNumbers(currentPage, totalPages).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 border rounded ${currentPage === page ? "bg-blue-600 text-white" : ""}`}
                                >{page}</button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >Next</button>
                        </div>
                    )}
                </div>

                {/* Form + Features */}
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
                                {components.map(c => <option key={c.id} value={c.id}>{c.componentName}</option>)}
                            </select>
                            <select
                                name="manufacturerId"
                                className="w-full p-2 border rounded"
                                value={formData.manufacturerId}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select Manufacturer *</option>
                                {manufacturers.map(m => <option key={m.id} value={m.id}>{m.manufacturerName}</option>)}
                            </select>
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
                        />
                    )}
                </div>
            </div>

            {/* Notification */}
            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() => setNotification({ show: false, type: "", message: "", action: null })}
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() => setNotification({ show: false, type: "", message: "", action: null })}
                errorMessage={notification.message}
                errorAction={notification.action}
                onErrorAction={async () => {
                    if (notification.action?.callback) await notification.action.callback();
                }}
                isActionLoading={isSubmitting}
            />
        </div>
    );
};

export default ItemManagement;