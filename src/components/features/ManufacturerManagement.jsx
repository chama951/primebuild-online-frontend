import {useState} from "react";
import {
    useGetManufacturersQuery,
    useSaveManufacturerMutation,
    useUpdateManufacturerMutation,
    useDeleteManufacturerMutation,
} from "../../features/components/manufacturerApi.js";
import ItemListTable from "../common/ItemListTable.jsx";
import NotificationDialogs from "../common/NotificationDialogs.jsx";

const ManufacturerManagement = () => {
    // state
    const [selectedManufacturer, setSelectedManufacturer] = useState(null);
    const [manufacturerName, setManufacturerName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Single notification state
    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
        action: null,
    });

    // api hooks
    const {data: manufacturersData = [], refetch: refetchManufacturers} = useGetManufacturersQuery();

    // Mutations
    const [createManufacturer] = useSaveManufacturerMutation();
    const [updateManufacturer] = useUpdateManufacturerMutation();
    const [deleteManufacturer] = useDeleteManufacturerMutation();

    // values and objects
    // Safe data handling
    const manufacturers = Array.isArray(manufacturersData)
        ? manufacturersData
            .filter((m) => m != null && m.id != null)
            .map((m) => ({
                ...m,
                manufacturerName: m.manufacturerName || "Unnamed",
            }))
        : [];

    // Filter manufacturers based on search term
    const filteredManufacturers = manufacturers.filter((manufacturer) =>
        manufacturer.manufacturerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // notification handlers
    const showNotification = (type, message, action = null) => {
        setNotification({show: true, type, message, action});
    };

    const handleConfirmAction = async () => {
        if (notification.action) {
            const {callback} = notification.action;
            setIsSubmitting(true);
            try {
                await callback();
                showNotification("success", notification.action.successMessage || "Action completed!");
            } catch (error) {
                console.error("Error:", error);
                showNotification("error", notification.action.errorMessage || "Error performing action.");
            } finally {
                setIsSubmitting(false);
                setNotification((prev) => ({...prev, action: null}));
            }
        }
    };

    // handlers
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!manufacturerName.trim()) {
            showNotification("error", "Please enter a manufacturer name");
            return;
        }

        setIsSubmitting(true);
        try {
            if (selectedManufacturer) {
                await updateManufacturer({
                    id: selectedManufacturer.id,
                    manufacturerName: manufacturerName.trim(),
                }).unwrap();
                showNotification("success", "Manufacturer updated successfully!");
            } else {
                await createManufacturer({
                    manufacturerName: manufacturerName.trim(),
                }).unwrap();
                showNotification("success", "Manufacturer created successfully!");
            }

            handleResetForm();
            refetchManufacturers();
        } catch (error) {
            console.error("Error saving manufacturer:", error);
            showNotification("error", "Error saving manufacturer.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectManufacturer = (manufacturer) => {
        setSelectedManufacturer(manufacturer);
        setManufacturerName(manufacturer.manufacturerName);
    };

    const handleResetForm = () => {
        setSelectedManufacturer(null);
        setManufacturerName("");
    };

    const handleDeleteManufacturer = (manufacturer) => {
        showNotification("error", `Are you sure you want to delete "${manufacturer.manufacturerName}"?`, {
            callback: async () => {
                await deleteManufacturer(manufacturer.id).unwrap();
                refetchManufacturers();
                if (selectedManufacturer?.id === manufacturer.id) {
                    handleResetForm();
                }
            },
            successMessage: "Manufacturer deleted successfully!",
            errorMessage: "Error deleting manufacturer.",
        });
    };

    // render
    const columns = [
        {
            key: "manufacturerName",
            header: "Manufacturer Name",
            render: (item) => <div className="text-sm font-medium">{item.manufacturerName}</div>,
        },
        {
            key: "id",
            header: "ID",
            render: (item) => <div className="text-sm text-gray-500">#{item.id}</div>,
        },
    ];

    return (
        <div className="container mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold">Manufacturer Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Manufacturer List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Search manufacturers..."
                                    className="w-full pl-4 pr-10 py-2 border rounded"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm("")}
                                            className="absolute right-3 top-2.5 text-gray-400">
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <ItemListTable
                        items={filteredManufacturers}
                        selectedItem={selectedManufacturer}
                        onSelectItem={handleSelectManufacturer}
                        onDeleteItemClick={handleDeleteManufacturer}
                        isLoading={false}
                        columns={columns}
                        emptyMessage="No manufacturers found"
                    />
                </div>

                {/* Right Column: Manufacturer Form */}
                <div className="space-y-4">
                    <div className="bg-white rounded-lg border p-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Manufacturer Name *"
                                className="w-full p-2 border rounded"
                                value={manufacturerName}
                                onChange={(e) => setManufacturerName(e.target.value)}
                                required
                            />

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !manufacturerName.trim()}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? "..." : selectedManufacturer ? "Update" : "Create"}
                                </button>
                                {!selectedManufacturer && (manufacturerName.trim()) && (
                                    <button
                                        type="button"
                                        onClick={handleResetForm}
                                        className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                    >
                                        Clear
                                    </button>
                                )}
                                {selectedManufacturer && (
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
                </div>
            </div>

            {/* Unified Notification Dialog */}
            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() => setNotification({show: false, type: "", message: "", action: null})}
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() => setNotification({show: false, type: "", message: "", action: null})}
                errorMessage={notification.message}
                errorAction={notification.action}
                onErrorAction={handleConfirmAction}
                isActionLoading={isSubmitting}
            />
        </div>
    );
};

export default ManufacturerManagement;